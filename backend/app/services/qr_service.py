"""DALTI Backend — QR code generation service.

Generates unique QR codes for tickets using the qrcode library.
"""

import qrcode
import uuid
import io
import base64
from typing import Tuple


class QRService:
    """QR code generation for tickets."""

    @staticmethod
    def generate_qr_data() -> str:
        """Generate a unique QR code string.

        Format: DALTI-{UUID4}
        This string is stored in the ticket and encoded into the QR image.
        """
        return f"DALTI-{uuid.uuid4().hex[:16].upper()}"

    @staticmethod
    def generate_qr_image(data: str) -> str:
        """Generate a QR code image as base64-encoded PNG.

        Args:
            data: The string to encode in the QR code.

        Returns:
            Base64-encoded PNG string (data URI format).
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=8,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#0B1E3C", back_color="white")

        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{b64}"

    @staticmethod
    def generate() -> Tuple[str, str]:
        """Generate both QR data string and image.

        Returns:
            Tuple of (qr_code_string, base64_image).
        """
        qr_data = QRService.generate_qr_data()
        qr_image = QRService.generate_qr_image(qr_data)
        return qr_data, qr_image
