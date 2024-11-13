from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time
# from django.core.paginator import Paginator
from django.db.models import Prefetch
from django.db.models import Q, F
from django.db.models import Count, Sum, Max, Min
# from django.db.models.functions import Concat
# from django.db.models import CharField
from django.core import serializers
from django.db.models import IntegerField, Value
from django.db.models.functions import Concat

from .models import *
from .forms import * 
# from utils.mltools import * 
from utils.generaltools import *
from utils.viewtools import *

import json
import os
import pickle

from asgiref.sync import sync_to_async

# Create your views here.
def index(request):

	pagetitle = 'title'
	template = loader.get_template('witness/index.html')

	#londoners_total = Individual.objects.filter(fk_individual_event__gt=1).distinct('id_individual').count()

	context = {
		'pagetitle': pagetitle,
		#'londoners_total': londoners_total,
		}

	return HttpResponse(template.render(context, request))

def explore(request, exploretype):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)


def information(request, informationtype):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)

def discover(request, discovertype):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)

def analyze(request, analyzetype):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)

def about(request):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)

def exhibit(request):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)


def search(request, searchtype):

### Parish

	if searchtype == "parish":

		#default
		qlondonparish= 50013947

		#adjust values if form submitted
		if request.method == 'POST':
			form = LondonparishForm(request.POST)
			
			if form.is_valid():
				londonparish = form.cleaned_data['londonparish']
				#make sure values are not empty then try and convert to ints
				if len(londonparish) > 0:
					qlondonparish = int(londonparish)
					targetphrase = "parish_page"
					return redirect(targetphrase, qlondonparish)

		else:
			form = LondonparishForm()

		template = loader.get_template('witness/search_parish.html')
		context = {
			'form': form,
			}

		return HttpResponse(template.render(context, request))

### Actor (Person)

	if searchtype == "person":

		pagetitle = 'title'

		londonevents = Location.objects.filter(fk_region=87).values('locationname__locationreference__fk_event')

		individual_object = individualsearch()

		individual_set1 = individual_object.exclude(
			id_individual=10000019).filter(
			fk_individual_event__in=londonevents)

		individual_object = individual_object.exclude(
			id_individual=10000019).filter(
			fk_individual_event__in=londonevents).distinct('id_individual').order_by('id_individual')

		if request.method == "POST":
			form = PeopleForm(request.POST)
			if form.is_valid():
				qname = form.cleaned_data['name']   
				qpagination = form.cleaned_data['pagination']

				if len(qname) > 0:
					individual_object = individual_object.filter(
						Q(
							fullname_modern__icontains=qname) | Q(
							fullname_original__icontains=qname) | Q(
							fk_descriptor_title__descriptor_original__icontains=qname)| Q(
							fk_descriptor_name__descriptor_original__icontains=qname)| Q(
							fk_descriptor_prefix1__prefix__icontains=qname)| Q(
							fk_descriptor_descriptor1__descriptor_original__icontains=qname)| Q(
							fk_descriptor_prefix2__prefix__icontains=qname)| Q(
							fk_descriptor_descriptor2__descriptor_original__icontains=qname)| Q(
							fk_descriptor_prefix3__prefix__icontains=qname)| Q(
							fk_descriptor_descriptor3__descriptor_original__icontains=qname)) 

				form = PeopleForm(request.POST)

		else:
			form = PeopleForm()
			qpagination = 1

		individual_object, totalrows, totaldisplay, qpagination = defaultpagination(individual_object, qpagination) 

		pagecountercurrent = qpagination
		pagecounternext = qpagination + 1
		pagecounternextnext = qpagination +2        

		individual_set = {}

		for i in individual_object:
			individual_info = {}
			individual_info['actor_name'] = namecompiler(i)
			individual_info['id_individual'] = i.id_individual

			individual_set[i.id_individual] = individual_info

		context = {
			'pagetitle': pagetitle,
			'individual_set': individual_set,
			'totalrows': totalrows,
			'totaldisplay': totaldisplay,
			'form': form,
			'pagecountercurrent': pagecountercurrent,
			'pagecounternext': pagecounternext,
			'pagecounternextnext': pagecounternextnext,
			}

		template = loader.get_template('witness/search_person.html')
		return HttpResponse(template.render(context, request))

async def person_page(request, witness_entity_number):

	template = loader.get_template('witness/person.html')

	individual_object = await individualsearch2(witness_entity_number)
	pagetitle= namecompiler(individual_object)

	# list of relationships for each actor
	relationship_dic, relationshipnumber = await relationship_dataset(witness_entity_number)

	# mapparishes = await mapparishesdata2(reference_set)
	mapparishes = await mapparishesdata2(witness_entity_number)

	context = {
		'pagetitle': pagetitle,
		'individual_object': individual_object,
		'relationship_dic': relationship_dic,
		'relationshipnumber' : relationshipnumber,
		#'reference_list' : reference_list,
		'parishes_dict': mapparishes,
		#'reference_set': reference_set,
		}

	template = loader.get_template('witness/person.html')
	return HttpResponse(template.render(context, request))

async def person_ajax(request, witness_entity_number):

	# list of references to the actor
	reference_list = await referenceset_references2(witness_entity_number)

	datareferences = json.dumps(reference_list)

	return (JsonResponse(datareferences, safe=False))


async def parishpersonajax(request, witness_entity_number):

	individual_object = await parish_fetch(witness_entity_number)
	individual_list = await parish_individuallistfetch(individual_object)

	datareferences = json.dumps(individual_list)

	return(JsonResponse(datareferences, safe=False)) 


def entity(request, witness_entity_number):

	print(witness_entity_number)

	#create flag that this is a view operation....
	operation = 1
	application = 2

	#item = 0, seal=1, manifestation=2, sealdescription=3, etc...
	targetphrase = redirectgenerator(witness_entity_number, operation, application)

	print ("targetphrase", targetphrase)

	return redirect(targetphrase)

async def parish_page(request, witness_entity_number):
 
	parish = await parishvalue(witness_entity_number)

	# individual_object = await parish_fetch(witness_entity_number)
	# individual_list = await parish_individuallistfetch(individual_object)
	#case_value, totalcases = await parishcases_fetch(individual_object)

	mapparishes = await parish_map(witness_entity_number, parish)

	template = loader.get_template('witness/parish.html')
	context = {
		'parish': parish,
		# 'individual_list': individual_list,
		'parishes_dict': mapparishes,
		}

	return HttpResponse(template.render(context, request))




def parishnetwork_page(request, witness_entity_number):

	#default
	qlondonparish= 50013947

	qlondonparish = witness_entity_number

	parishevents = Location.objects.filter(id_location=qlondonparish).values('locationname__locationreference__fk_event')

	exclusionset = Digisigrelationshipview.objects.filter(Q(person2=10140149)|Q(person2=10140449)|Q(person2=10139569)).values('fk_individual')

	reference_set = Referenceindividual.objects.filter(
		fk_referencerole=1).exclude(
		fk_individual=10000019).exclude(
		fk_individual__in=exclusionset).filter(
		fk_event__in=parishevents)

	reference_set = referencecollectindividual(reference_set)

	reference_set = reference_set.values(
		'fk_individual', 
		'fk_event', 
		'fk_individual__fullname_original',
		'fk_individual__fk_descriptor_name__descriptor_modern',
		'fk_individual__fk_descriptor_prefix1__prefix_english',
		'fk_individual__fk_descriptor_descriptor1__descriptor_modern',
		'fk_individual__fk_descriptor_prefix2__prefix_english',
		'fk_individual__fk_descriptor_descriptor2__descriptor_modern',
		'fk_individual__fk_descriptor_prefix3__prefix_english').order_by('pk_referenceindividual')

	linkslist, nodelist = networkgenerator(reference_set)

	template = loader.get_template('witness/parish_graph.html')
	context = {
		'nodelist': nodelist,
		'linkslist': linkslist,
		}

	return HttpResponse(template.render(context, request))

def part_page(request, witness_entity_number):

	externallinkset = externallinkgenerator(witness_entity_number)

	part_object = Part.objects.select_related(
		'fk_item').select_related(
		'fk_event').select_related(
		'fk_item__fk_repository').get(id_part=witness_entity_number)

	pagetitle = part_object.fk_item.fk_repository.repository_fulltitle + " " + part_object.fk_item.shelfmark

	event_dic = {}
	event_object = part_object.fk_event
	item_object = part_object.fk_item
	event_dic["part_object"] = part_object
	event_dic = eventset_datedata(event_object, event_dic)
	event_dic = eventset_locationdata(event_object, event_dic)
	event_dic = eventset_references(event_object, event_dic)

	place_object = event_dic["location"]
	mapdic = mapgenerator(place_object, 0)

	#for part images (code to show images not implemented yet)
	representationset = {}

	try: 
		representation_part = Representation.objects.filter(fk_digisig=part_object.id_part).select_related('fk_connection')

		for t in representation_part:
			#Holder for representation info
			representation_dic = {}

			#for all images
			connection = t.fk_connection
			representation_dic["connection"] = t.fk_connection
			representation_dic["connection_thumb"] = t.fk_connection.thumb
			representation_dic["connection_medium"] = t.fk_connection.medium
			representation_dic["representation_filename"] = t.representation_filename_hash
			representation_dic["representation_thumbnail"] = t.representation_thumbnail_hash
			representation_dic["id_representation"] = t.id_representation 
			representation_dic["fk_digisig"] = t.fk_digisig
			representation_dic["repository_fulltitle"] = item_object.fk_repository.repository_fulltitle
			representation_dic["shelfmark"] = item_object.shelfmark
			representation_dic["fk_item"] = item_object.id_item
			representationset[t.id_representation] = representation_dic

	except:
		print ('no image of document available')

	## prepare the data for each displayed seal manifestation

	template = loader.get_template('witness/item.html')
	context = {
		'pagetitle': pagetitle,
		'item_object': item_object,
		'event_dic': event_dic,
		'mapdic': mapdic,
		'representationset': representationset,
		# 'manifestationset': manifestation_set,
		# 'totalrows': totalrows,
		# 'totaldisplay': totaldisplay,
		'externallink_object': externallinkset,
		#'location': location,
		#'location_dict': location_dict,
		}

	return HttpResponse(template.render(context, request))



def item_page(request, witness_entity_number):

	starttime = time()

	try:
		manifestation_object = sealsearch()
		manifestation_object = manifestation_object.filter(
			fk_support__fk_part__fk_item=witness_entity_number).order_by(
			"fk_support__fk_number_currentposition")

		firstmanifestation = manifestation_object.first()
		item_object = firstmanifestation.fk_support.fk_part.fk_item
		part_object = firstmanifestation.fk_support.fk_part
		event_object = firstmanifestation.fk_support.fk_part.fk_event

	except:
		part_object = Part.objects.get(fk_item=witness_entity_number)
		event_object = part_object.fk_event
		item_object = part_object.fk_item

	pagetitle = item_object.fk_repository.repository_fulltitle + " " + item_object.shelfmark

	event_dic = {}
	event_dic["part_object"] = part_object
	event_dic = eventset_datedata(event_object, event_dic)
	event_dic = eventset_locationdata(event_object, event_dic)
	event_dic = eventset_references(event_object, event_dic)

	place_object = event_dic["location"]
	mapdic = mapgenerator(place_object, 0)
	externallinkset = externallinkgenerator(witness_entity_number)

	#for part images (code to show images not implemented yet)
	representationset = {}

	try: 
		representation_part = Representation.objects.filter(fk_digisig=part_object.id_part).select_related('fk_connection')

		for t in representation_part:
			#Holder for representation info
			representation_dic = {}

			#for all images
			connection = t.fk_connection
			representation_dic["connection"] = t.fk_connection
			representation_dic["connection_thumb"] = t.fk_connection.thumb
			representation_dic["connection_medium"] = t.fk_connection.medium
			representation_dic["representation_filename"] = t.representation_filename_hash
			representation_dic["representation_thumbnail"] = t.representation_thumbnail_hash
			representation_dic["id_representation"] = t.id_representation 
			representation_dic["fk_digisig"] = t.fk_digisig
			representation_dic["repository_fulltitle"] = item_object.fk_repository.repository_fulltitle
			representation_dic["shelfmark"] = item_object.shelfmark
			representation_dic["fk_item"] = item_object.id_item
			representationset[t.id_representation] = representation_dic

	except:
		print ('no image of document available')

	## prepare the data for each displayed seal manifestation

	manifestation_set = {}

	try:
		for e in manifestation_object:
			manifestation_dic = {}
			manifestation_dic = manifestation_fetchrepresentations(e, manifestation_dic)
			manifestation_dic = manifestation_fetchsealdescriptions(e, manifestation_dic)
			manifestation_dic = manifestation_fetchstandardvalues (e, manifestation_dic)
			manifestation_set[e.id_manifestation] = manifestation_dic

		totalrows = manifestation_object.count
		totaldisplay = len(manifestation_set)

	except:
		totalrows = 0
		totaldisplay = 0

	print("Compute Time:", time()-starttime)

	template = loader.get_template('witness/item.html')
	context = {
		'pagetitle': pagetitle,
		'item_object': item_object,
		'event_dic': event_dic,
		'mapdic': mapdic,
		'representationset': representationset,
		'manifestationset': manifestation_set,
		'totalrows': totalrows,
		'totaldisplay': totaldisplay,
		'externallink_object': externallinkset,
		#'location': location,
		#'location_dict': location_dict,
		}

	return HttpResponse(template.render(context, request))


def seal_page(request, witness_entity_number):

	print (request)
	targetphrase = "parish_page"

	return redirect(targetphrase, 50013947)


def personnetwork_page(request, witness_entity_number):

	#default
	qpersonnetwork = witness_entity_number
 
	reference_set1 = Referenceindividual.objects.filter(fk_individual=qpersonnetwork).distinct('fk_event')

	witnessevents = Referenceindividual.objects.filter(
		fk_referencerole=1).filter(
		fk_individual=qpersonnetwork).values('fk_event')

	reference_set = Referenceindividual.objects.filter(
		fk_referencerole=1).exclude(fk_individual=10000019).filter(
		fk_event__in=witnessevents)

	reference_set = referencecollectindividual(reference_set)

	linkslist, nodelist = networkgenerator(reference_set)

	template = loader.get_template('witness/person_graph.html')
	context = {
		'nodelist': nodelist,
		'linkslist': linkslist,
		}

	return HttpResponse(template.render(context, request))