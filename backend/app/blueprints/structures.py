"""DALTI Backend — Structures & Services blueprint."""

from flask import Blueprint, request, jsonify
from app.repositories.structure_repo import StructureRepository, ServiceRepository

structures_bp = Blueprint("structures", __name__, url_prefix="/api")


@structures_bp.route("/structures", methods=["GET"])
def list_structures():
    """List all structures with their total waiting counts."""
    wilaya = request.args.get("wilaya")
    structures = StructureRepository.find_all(wilaya=wilaya)
    from app.extensions import get_supabase
    
    # Batch count waiting tickets per structure
    for s in structures:
        res = get_supabase().table("queues").select("id").eq("structure_id", s["id"]).execute()
        q_ids = [q["id"] for q in (res.data or [])]
        if q_ids:
            count_res = get_supabase().table("tickets").select("id", count="exact").in_("queue_id", q_ids).eq("status", "waiting").execute()
            s["total_waiting"] = count_res.count or 0
        else:
            s["total_waiting"] = 0
            
    return jsonify({"structures": structures}), 200


@structures_bp.route("/structures/<structure_id>", methods=["GET"])
def get_structure(structure_id: str):
    """Get structure details."""
    structure = StructureRepository.find_by_id(structure_id)
    if not structure:
        return jsonify({"error": "Structure not found", "code": "NOT_FOUND"}), 404
    return jsonify({"structure": structure}), 200


@structures_bp.route("/structures/<structure_id>/services", methods=["GET"])
def structure_services(structure_id: str):
    """Get services available at a structure."""
    services = StructureRepository.get_services_for_structure(structure_id)
    return jsonify({"services": services}), 200


@structures_bp.route("/services", methods=["GET"])
def list_services():
    """List all services with global waiting counts."""
    services = ServiceRepository.find_all()
    from app.extensions import get_supabase
    
    # Get all waiting tickets count per service
    for s in services:
        res = get_supabase().table("queues").select("id").eq("service_id", s["id"]).execute()
        q_ids = [q["id"] for q in (res.data or [])]
        if q_ids:
            count_res = get_supabase().table("tickets").select("id", count="exact").in_("queue_id", q_ids).eq("status", "waiting").execute()
            s["total_waiting"] = count_res.count or 0
        else:
            s["total_waiting"] = 0
            
    return jsonify({"services": services}), 200


@structures_bp.route("/services/popular", methods=["GET"])
def popular_services():
    """List popular services with global waiting counts."""
    services = ServiceRepository.find_popular()
    from app.extensions import get_supabase
    for s in services:
        res = get_supabase().table("queues").select("id").eq("service_id", s["id"]).execute()
        q_ids = [q["id"] for q in (res.data or [])]
        if q_ids:
            count_res = get_supabase().table("tickets").select("id", count="exact").in_("queue_id", q_ids).eq("status", "waiting").execute()
            s["total_waiting"] = count_res.count or 0
        else:
            s["total_waiting"] = 0
    return jsonify({"services": services}), 200


@structures_bp.route("/stats", methods=["GET"])
def global_stats():
    """Get real-time global platform statistics."""
    from app.extensions import get_supabase
    from datetime import datetime, timezone, timedelta

    supabase = get_supabase()

    # Total services
    svc_res = supabase.table("services").select("id", count="exact").execute()
    total_services = svc_res.count or 0

    # Total people waiting right now (all queues)
    waiting_res = supabase.table("tickets").select("id", count="exact").eq("status", "waiting").execute()
    total_waiting = waiting_res.count or 0

    # Tickets served today (completed + missed)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    served_res = (
        supabase.table("tickets")
        .select("id", count="exact")
        .in_("status", ["completed", "missed"])
        .gte("created_at", today_start)
        .execute()
    )
    served_today = served_res.count or 0

    # Global average wait time (last 50 completed tickets with actual_wait_time)
    avg_res = (
        supabase.table("tickets")
        .select("actual_wait_time")
        .eq("status", "completed")
        .not_.is_("actual_wait_time", "null")
        .gt("actual_wait_time", 0)
        .order("completed_at", desc=True)
        .limit(50)
        .execute()
    )
    wait_times = [r["actual_wait_time"] for r in (avg_res.data or [])]
    avg_wait = round(sum(wait_times) / len(wait_times), 1) if wait_times else 0

    # Total structures
    struct_res = supabase.table("structures").select("id", count="exact").execute()
    total_structures = struct_res.count or 0

    return jsonify({
        "stats": {
            "total_services": total_services,
            "total_waiting": total_waiting,
            "served_today": served_today,
            "avg_wait_time": avg_wait,
            "total_structures": total_structures,
        }
    }), 200
