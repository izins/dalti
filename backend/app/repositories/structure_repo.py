"""DALTI Backend — Structure & Service repositories."""

from typing import Optional
from app.extensions import get_supabase


class StructureRepository:
    """Data access for structures table."""

    TABLE = "structures"

    @staticmethod
    def find_all(wilaya: Optional[str] = None) -> list[dict]:
        """List structures, optionally filtered by wilaya."""
        query = get_supabase().table(StructureRepository.TABLE).select("*")
        if wilaya:
            query = query.eq("wilaya", wilaya)
        result = query.order("name").execute()
        return result.data or []

    @staticmethod
    def find_by_id(structure_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(StructureRepository.TABLE)
            .select("*")
            .eq("id", structure_id)
            .maybe_single()
            .execute()
        )
        return result.data

    @staticmethod
    def get_services_for_structure(structure_id: str) -> list[dict]:
        """Get services available at a structure via junction table."""
        result = (
            get_supabase()
            .table("structure_services")
            .select("*, services(*)")
            .eq("structure_id", structure_id)
            .execute()
        )
        return [r["services"] for r in (result.data or []) if r.get("services")]


class ServiceRepository:
    """Data access for services table."""

    TABLE = "services"

    @staticmethod
    def find_all() -> list[dict]:
        result = get_supabase().table(ServiceRepository.TABLE).select("*").order("name").execute()
        return result.data or []

    @staticmethod
    def find_popular() -> list[dict]:
        result = (
            get_supabase()
            .table(ServiceRepository.TABLE)
            .select("*")
            .eq("is_popular", True)
            .order("name")
            .execute()
        )
        return result.data or []

    @staticmethod
    def find_by_id(service_id: str) -> Optional[dict]:
        result = (
            get_supabase()
            .table(ServiceRepository.TABLE)
            .select("*")
            .eq("id", service_id)
            .maybe_single()
            .execute()
        )
        return result.data
