import hashlib
import json
import math
from datetime import timedelta
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods, require_POST
from .forms import SignupForm, LoginForm
from .models import Snapshot, LoginAttempt

@require_http_methods(['GET', 'POST'])
def account(request, mode):
    if request.user.is_authenticated:
        return redirect('/')
    signup = mode == 'signup'
    form = SignupForm(request.POST or None) if signup else LoginForm(request, data=request.POST or None)
    if request.method == 'POST':
        # Persistent per-client throttling works across Django workers/restarts.
        key = hashlib.sha256((request.META.get('REMOTE_ADDR', '') + ':' + mode).encode()).hexdigest()
        attempt, _ = LoginAttempt.objects.get_or_create(key=key, defaults={'started_at': timezone.now()})
        if timezone.now() - attempt.started_at > timedelta(minutes=10):
            attempt.failures = 0
            attempt.started_at = timezone.now()
            attempt.save()
        if attempt.failures >= 10:
            form.add_error(None, 'Too many attempts. Please try again in 10 minutes.')
            return render(request, 'upgrade/auth.html', {'form': form, 'signup': signup}, status=429)
        if form.is_valid():
            try:
                user = form.save() if signup else form.get_user()
            except IntegrityError:
                form.add_error('username', 'This username is already taken.')
            else:
                login(request, user)
                attempt.delete()
                return redirect('/')
        attempt.failures += 1
        attempt.save()
    return render(request, 'upgrade/auth.html', {'form': form, 'signup': signup})

@require_POST
def signout(request):
    logout(request)
    return redirect('/login/')

@login_required
@ensure_csrf_cookie
def home(request):
    return render(request, 'upgrade/dashboard.html')

DIET = {'plant':70, 'vegetarian':100, 'mixed':160}
def estimate(payload):
    def number(key, max_value):
        value = float(payload[key])
        if not math.isfinite(value) or value < 0 or value > max_value:
            raise ValueError()
        return value
    travel, energy, shopping = number('travel',100000), number('energy',100000), number('shopping',10000)
    if not shopping.is_integer():
        raise ValueError()
    cuts = {key:number(key,100)/100 for key in ('travel_cut','energy_cut','solar_cut','shopping_cut')}
    food = DIET[payload['food']]
    target = payload['diet_target']
    food_after = food if target == 'same' else DIET[target]
    total = travel*.18 + energy*.7 + food + shopping*15
    after = travel*.18*(1-cuts['travel_cut']) + energy*.7*(1-cuts['energy_cut'])*(1-cuts['solar_cut']) + food_after + shopping*15*(1-cuts['shopping_cut'])
    return round(total,2), round(after,2)

@require_http_methods(['GET','POST','DELETE'])
def snapshots(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error':'Please log in again to access your history.'},status=401)
    rows = Snapshot.objects.filter(user=request.user)
    if request.method == 'POST':
        try:
            payload = json.loads(request.body)
            total, after = estimate(payload)
        except (ValueError, TypeError, KeyError, OverflowError):
            return JsonResponse({'error':'Check your calculator and scenario inputs.'}, status=400)
        Snapshot.objects.create(user=request.user, total_kg=total, scenario_kg=after, inputs=payload)
        return JsonResponse({'message':'Snapshot saved to your account.'}, status=201)
    if request.method == 'DELETE':
        rows.delete()
        return JsonResponse({'message':'Your saved snapshots were cleared.'})
    return JsonResponse({'records':[{'id':r.id, 'created_at':timezone.localtime(r.created_at).strftime('%Y-%m-%d %H:%M'), 'total_kg':r.total_kg, 'scenario_kg':r.scenario_kg} for r in rows.order_by('-id')[:50]]})
