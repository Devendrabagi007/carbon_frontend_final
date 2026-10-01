import json
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from upgrade.models import Snapshot
from upgrade.views import snapshots as existing_snapshots

@login_required
@ensure_csrf_cookie
def home(request):
    return render(request, 'simple_simulator/dashboard.html')

def estimate(payload):
    if not isinstance(payload, dict):
        raise ValueError('Invalid input.')
    def number(key, maximum, whole=False):
        value = Decimal(str(payload[key]))
        if not value.is_finite() or value < 0 or value > maximum:
            raise ValueError('Enter an amount between zero and your current monthly activity.')
        if whole and value != value.to_integral_value():
            raise ValueError('Enter a whole number of items.')
        return value
    travel = number('travel',100000)
    energy = number('energy',100000)
    shopping = number('shopping',10000,True)
    walk = number('walk_km',travel)
    electricity = number('energy_saved_kwh',energy)
    items = number('items_avoided',shopping,True)
    diets = {'plant':Decimal(70),'vegetarian':Decimal(100),'mixed':Decimal(160)}
    food = diets[payload['food']]
    food_after = food if payload['diet_target'] == 'same' else diets[payload['diet_target']]
    total = travel*Decimal('.18') + energy*Decimal('.70') + shopping*15 + food
    after = (travel-walk)*Decimal('.18') + (energy-electricity)*Decimal('.70') + (shopping-items)*15 + food_after
    rounding = lambda n: float(n.quantize(Decimal('.01'),rounding=ROUND_HALF_UP))
    return rounding(total), rounding(after)

@require_http_methods(['GET','POST','DELETE'])
def snapshots(request):
    if request.method != 'POST' or not request.user.is_authenticated:
        return existing_snapshots(request)
    try:
        payload = json.loads(request.body)
        total, after = estimate(payload)
    except (ValueError, TypeError, KeyError, InvalidOperation, OverflowError):
        return JsonResponse({'error':'Use valid amounts. Reductions cannot exceed your monthly activity; items must be whole numbers.'},status=400)
    Snapshot.objects.create(user=request.user,total_kg=total,scenario_kg=after,inputs=payload)
    return JsonResponse({'message':'Snapshot saved to your account.'},status=201)
