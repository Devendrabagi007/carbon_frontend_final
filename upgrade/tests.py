import json
from django.test import TestCase, Client
from django.contrib.auth.models import User
from .views import estimate

class UpgradeTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('tester', password='Mountain-Wind-84!')
        self.payload = dict(travel=300,energy=100,shopping=2,food='vegetarian',travel_cut=20,energy_cut=10,solar_cut=50,shopping_cut=50,diet_target='plant')
    def test_guest_is_redirected_and_api_is_private(self):
        self.assertEqual(self.client.get('/').status_code,302)
        self.assertEqual(self.client.get('/api/snapshots/').status_code,401)
    def test_signup_login_logout(self):
        response = self.client.post('/signup/',dict(first_name='Student',username='student',email='s@example.com',password1='Forest-River-849!',password2='Forest-River-849!'))
        self.assertRedirects(response,'/')
        user=User.objects.get(username='student')
        self.assertTrue(user.check_password('Forest-River-849!'))
        self.assertNotEqual(user.password,'Forest-River-849!')
        self.assertEqual(self.client.get('/logout/').status_code,405)
        self.client.post('/logout/')
        self.assertEqual(self.client.get('/').status_code,302)
        self.assertRedirects(self.client.post('/login/',dict(username='STUDENT',password='Forest-River-849!')),'/')
    def test_weak_password_and_duplicate_username(self):
        payload=dict(first_name='Test',username='new',email='n@example.com',password1='123',password2='123')
        self.assertEqual(self.client.post('/signup/',payload).status_code,200)
        self.assertFalse(User.objects.filter(username='new').exists())
        payload.update(username='TESTER',password1='Forest-River-849!',password2='Forest-River-849!')
        self.client.post('/signup/',payload)
        self.assertEqual(User.objects.count(),1)
    def test_calculation_and_account_isolation(self):
        self.assertEqual(estimate(self.payload),(254,159.7))
        self.client.force_login(self.user)
        self.assertEqual(self.client.post('/api/snapshots/',json.dumps(self.payload),content_type='application/json').status_code,201)
        self.assertEqual(len(self.client.get('/api/snapshots/').json()['records']),1)
        other=User.objects.create_user('another',password='Mountain-Wind-84!')
        self.client.force_login(other)
        self.assertEqual(self.client.get('/api/snapshots/').json()['records'],[])
        self.client.delete('/api/snapshots/')
        self.client.force_login(self.user)
        self.assertEqual(len(self.client.get('/api/snapshots/').json()['records']),1)
        self.client.delete('/api/snapshots/')
        self.assertEqual(self.client.get('/api/snapshots/').json()['records'],[])
    def test_input_validation_and_csrf(self):
        self.client.force_login(self.user)
        for key,value in [('travel',-1),('energy','nan'),('shopping',2.5),('solar_cut',101),('diet_target','invalid')]:
            self.assertEqual(self.client.post('/api/snapshots/',json.dumps({**self.payload,key:value}),content_type='application/json').status_code,400)
        csrf_client=Client(enforce_csrf_checks=True)
        csrf_client.force_login(self.user)
        self.assertEqual(csrf_client.post('/api/snapshots/',json.dumps(self.payload),content_type='application/json').status_code,403)
    def test_throttle(self):
        for _ in range(10):
            self.client.post('/login/',{'username':'tester','password':'wrong'})
        self.assertEqual(self.client.post('/login/',{'username':'tester','password':'wrong'}).status_code,429)
