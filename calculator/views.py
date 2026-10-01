import json
import logging
import uuid
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

import mysql.connector
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .db import get_connection


logger = logging.getLogger(__name__)
DIET_FACTORS = {
    "plant": Decimal("70"),
    "vegetarian": Decimal("100"),
    "mixed": Decimal("160"),
}


def _visitor_id(request):
    value = request.get_signed_cookie(
        "carbon_visitor", default=None, salt="carbon-history"
    )
    return value if value and len(value) == 32 else None


@ensure_csrf_cookie
def home(request):
    response = render(request, "calculator/index.html")
    if not _visitor_id(request):
        response.set_signed_cookie(
            "carbon_visitor",
            uuid.uuid4().hex,
            salt="carbon-history",
            max_age=60 * 60 * 24 * 365,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )
    return response


def _decimal(payload, key, maximum):
    value = Decimal(str(payload[key]))
    if not value.is_finite() or value < 0 or value > maximum:
        raise ValueError(f"{key} is outside the allowed range.")
    return value


@require_http_methods(["GET", "POST", "DELETE"])
def snapshots(request):
    visitor = _visitor_id(request)
    if not visitor:
        return JsonResponse(
            {"error": "Reload the page and allow cookies."}, status=400
        )

    payload = None
    if request.method == "POST":
        try:
            payload = json.loads(request.body)
            if not isinstance(payload, dict):
                raise ValueError
            travel = _decimal(payload, "travel", Decimal("100000"))
            energy = _decimal(payload, "energy", Decimal("100000"))
            shopping = _decimal(payload, "shopping", Decimal("10000"))
            travel_cut = _decimal(payload, "travel_cut", Decimal("100"))
            energy_cut = _decimal(payload, "energy_cut", Decimal("100"))
            diet = payload["food"]
            if diet not in DIET_FACTORS:
                raise ValueError("Choose a valid diet option.")
            if shopping != shopping.to_integral_value():
                raise ValueError("Purchases must be a whole number.")
        except (ValueError, TypeError, KeyError, InvalidOperation, json.JSONDecodeError):
            return JsonResponse(
                {"error": "Check the calculator inputs and try again."}, status=400
            )

        # These illustrative values match the current frontend prototype.
        travel_kg = travel * Decimal("0.18")
        energy_kg = energy * Decimal("0.70")
        food_kg = DIET_FACTORS[diet]
        shopping_kg = shopping * Decimal("15")
        total = travel_kg + energy_kg + food_kg + shopping_kg
        scenario = total - travel_kg * travel_cut / 100 - energy_kg * energy_cut / 100
        total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        scenario = scenario.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    try:
        connection = get_connection()
        try:
            cursor = connection.cursor(dictionary=True)
            try:
                if request.method == "POST":
                    cursor.execute(
                        """INSERT INTO carbon_snapshots
                        (visitor_id, travel_km, electricity_kwh, diet, purchases,
                         travel_cut, energy_cut, total_kg, scenario_kg)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (visitor, travel, energy, diet, int(shopping), travel_cut,
                         energy_cut, total, scenario),
                    )
                    connection.commit()
                    return JsonResponse(
                        {"message": "Snapshot saved to MySQL."}, status=201
                    )

                if request.method == "DELETE":
                    cursor.execute(
                        "DELETE FROM carbon_snapshots WHERE visitor_id = %s",
                        (visitor,),
                    )
                    connection.commit()
                    return JsonResponse({"message": "Snapshots cleared."})

                cursor.execute(
                    """SELECT id, created_at, total_kg, scenario_kg
                    FROM carbon_snapshots WHERE visitor_id = %s
                    ORDER BY id DESC LIMIT 12""",
                    (visitor,),
                )
                records = cursor.fetchall()
                for record in records:
                    record["created_at"] = record["created_at"].strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                    record["total_kg"] = float(record["total_kg"])
                    record["scenario_kg"] = float(record["scenario_kg"])
                return JsonResponse({"records": records})
            finally:
                cursor.close()
        finally:
            connection.close()
    except (mysql.connector.Error, KeyError, OSError):
        logger.exception("MySQL request failed")
        return JsonResponse(
            {"error": "Could not reach the database. Check its connection settings."},
            status=503,
        )
