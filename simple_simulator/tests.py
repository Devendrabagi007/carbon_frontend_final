import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from upgrade.models import Snapshot
from .views import estimate

class SimpleSimulatorTests(TestCase):
    def setUp(self):
        self.user=User.objects.create_user('simpletest',password='Forest-River-849!')
        self.payload=dict(travel=300,energy=100,shopping=2,food='vegetarian',walk_km=60,energy_saved_kwh=10,items_avoided=1,diet_target='same')
    def test_units_and_limits(self):
        self.assertEqual(estimate(self.payload),(254,221.2))
        self.assertEqual(estimate({**self.payload,'walk_km':0,'energy_saved_kwh':0,'items_avoided':0}),(254,254))
        self.assertEqual(estimate({**self.payload,'walk_km':300,'energy_saved_kwh':100,'items_avoided':2}),(254,100))
        self.assertEqual(estimate({**self.payload,'travel':0,'energy':0,'shopping':0,'walk_km':0,'energy_saved_kwh':0,'items_avoided':0}),(100,100))
        self.assertEqual(estimate({**self.payload,'walk_km':0,'energy_saved_kwh':0,'items_avoided':0,'diet_target':'mixed'}),(254,314))
        self.assertEqual(estimate({**self.payload,'walk_km':60.5,'energy_saved_kwh':10.5}),(254,220.76))
    def test_invalid_requests(self):
        self.client.force_login(self.user)
        for key,value in [('walk_km',301),('walk_km',-1),('energy_saved_kwh',101),('items_avoided',3),('items_avoided',1.5),('walk_km','NaN'),('walk_km',''),('energy_saved_kwh','Infinity'),('diet_target','bad')]:
            r=self.client.post('/api/snapshots/',json.dumps({**self.payload,key:value}),content_type='application/json')
            self.assertEqual(r.status_code,400,(key,value))
        for body in ('null','[]','broken'):
            self.assertEqual(self.client.post('/api/snapshots/',body,content_type='application/json').status_code,400)
        self.assertEqual(Snapshot.objects.count(),0)
    def test_snapshot_matches_units_and_keeps_old_history_private(self):
        Snapshot.objects.create(user=self.user,total_kg=254,scenario_kg=200.8,inputs={'travel_cut':30})
        self.client.force_login(self.user)
        self.assertEqual(self.client.post('/api/snapshots/',json.dumps(self.payload),content_type='application/json').status_code,201)
        records=self.client.get('/api/snapshots/').json()['records']
        self.assertEqual(len(records),2)
        self.assertEqual(records[0]['scenario_kg'],221.2)
        other=User.objects.create_user('other',password='Forest-River-849!')
        self.client.force_login(other)
        self.assertEqual(self.client.get('/api/snapshots/').json()['records'],[])
        self.client.delete('/api/snapshots/')
        self.assertEqual(Snapshot.objects.count(),2)
    def test_login_template_and_csrf(self):
        self.assertEqual(self.client.get('/').status_code,302)
        self.assertEqual(self.client.post('/api/snapshots/',json.dumps(self.payload),content_type='application/json').status_code,401)
        self.assertRedirects(self.client.post('/login/',dict(username='simpletest',password='Forest-River-849!')),'/')
        response=self.client.get('/')
        self.assertContains(response,'id="walk-km"')
        self.assertNotContains(response,'id="travel-cut"')
        self.assertNotContains(response,'id="goal"')
        csrf=Client(enforce_csrf_checks=True);csrf.force_login(self.user)
        self.assertEqual(csrf.post('/api/snapshots/',json.dumps(self.payload),content_type='application/json').status_code,403)
