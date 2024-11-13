from django.urls import path, re_path
from debug_toolbar.toolbar import debug_toolbar_urls

#https://www.valentinog.com/blog/django-vhosts/

#from .views import *

from . import views

urlpatterns = [
	#path("witness/", index, name="index")
	path('', views.index, name='index'),
	path('explore/<str:exploretype>', views.explore, name='explore'),
	path('search/<str:searchtype>', views.search, name='search'),
	path('information/<str:infotype>', views.information, name='information'),
	path('discover/<str:discovertype>', views.discover, name='discover'),
	path('analyze/<str:analysistype>', views.analyze, name='analyze'),
	path('about', views.about, name='about'),
	path('exhibit', views.exhibit, name='exhibit'),


	re_path(r'page/person/(?P<witness_entity_number>[0-9]{8})', views.person_page, name='person_page'),
	re_path(r'page/person/graph/(?P<witness_entity_number>[0-9]{8})', views.personnetwork_page, name='personnetwork_page'),
	re_path(r'person_ajax/(?P<witness_entity_number>[0-9]{8})', views.person_ajax, name='person_ajax'),
	# re_path(r'map_person_ajax/(?P<witness_entity_number>[0-9]{8})', views.map_person_ajax, name='map_person_ajax'),

	re_path(r'page/parish/(?P<witness_entity_number>[0-9]{8})', views.parish_page, name='parish_page'),
	re_path(r'page/parish/graph/(?P<witness_entity_number>[0-9]{8})', views.parishnetwork_page, name='parishnetwork_page'),
	#re_path(r'parish_person_ajax/(?P<witness_entity_number>[0-9]{8})', views.parish_person_ajax, name='parish_person_ajax'),
	re_path(r'parishpersonajax/(?P<witness_entity_number>[0-9]{8})', views.parishpersonajax, name='parishpersonajax'),

	re_path(r'page/item/(?P<witness_entity_number>[0-9]{8})', views.item_page, name='item_page'),
	re_path(r'page/part/(?P<witness_entity_number>[0-9]{8})', views.part_page, name='part_page'),
	re_path(r'page/seal/(?P<witness_entity_number>[0-9]{8})', views.seal_page, name='seal_page'),
	re_path(r'entity/(?P<witness_entity_number>[0-9]{8})', views.entity, name='entity'),

] #+ debug_toolbar_urls()
# ]
