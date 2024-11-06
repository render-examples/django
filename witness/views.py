from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time
# from django.core.paginator import Paginator
from django.db.models import Prefetch
from django.db.models import Q, F
from django.db.models import Count
from django.db.models import Sum
# from django.db.models.functions import Concat
# from django.db.models import CharField
from django.core import serializers
from django.db.models import IntegerField, Value


from .models import *
from .forms import * 
# from utils.mltools import * 
from utils.generaltools import *
from utils.viewtools import *

import json
import os
import pickle


# Create your views here.
def index(request):

    pagetitle = 'title'
    template = loader.get_template('witness/index.html')


    londoners_total = Individual.objects.filter(fk_individual_event__gt=1).distinct('id_individual').count()

    context = {
        'pagetitle': pagetitle,
        'londoners_total': londoners_total,
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

        # print (len(londonevents))

        individual_object = individualsearch()

        # print (len(individual_object))

        individual_set1 = individual_object.exclude(
            id_individual=10000019).filter(
            fk_individual_event__in=londonevents)

        # print (len(individual_set1))        

        individual_object = individual_object.exclude(
            id_individual=10000019).filter(
            fk_individual_event__in=londonevents).distinct('id_individual')

        # print (len(individual_object))

        if request.method == "POST":
            form = PeopleForm(request.POST)
            if form.is_valid():
                qname = form.cleaned_data['name']   
                qpagination = form.cleaned_data['pagination']

                if len(qname) > 0:
                    individual_object = individual_object.filter(
                        Q(fullname_modern__icontains=qname) | Q(fullname_original__icontains=qname)) 

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

def person_page(request, witness_entity_number):

    individual_object = individualsearch()
    individual_object = individual_object.get(id_individual=witness_entity_number)

    pagetitle= namecompiler(individual_object)

    template = loader.get_template('witness/person.html')

    # list of relationships for each actor
    relationship_object = []            
    relationship_object = Digisigrelationshipview.objects.filter(fk_individual = witness_entity_number)
    relationshipnumber = len(relationship_object)

    # list of references to the actor
    reference_set = referenceset_references(individual_object)

    # parish where active
    parishstats = {}
    parishnamevalues = {}

    for r in reference_set.values():
        #parishvalue = r['location_id']
        parisholdid = r['location_pk']
        parishname = r['location']
        if parisholdid in parishstats:
            parishstats[parisholdid] += 1
        else:
            parishstats[parisholdid] = 1
            parishnamevalues[parisholdid] = parishname

    print (parishstats)

    mapparishes = []

    ## data for colorpeth map
    mapparishes1 = get_object_or_404(Jsonstorage, id_jsonfile=2)
    mapparishes = json.loads(mapparishes1.jsonfiletxt)

    for i in mapparishes:
        if i == "features":
            for b in mapparishes[i]:
                j = b["properties"]
                parishvalue = j["fk_locatio"]
                try:
                    j["cases"] = parishstats[parishvalue]
                    j["parishname"] = parishnamevalues[parishvalue]
                    #print ("found", parishvalue)
                except:
                    pass
                    #print ("can't find", parishvalue)
    
    # #adjust values if form submitted
    # if request.method == 'POST':
    #     form = LondonparishForm(request.POST)
        
    #     if form.is_valid():
    #         londonparish = form.cleaned_data['londonparish']
    #         #make sure values are not empty then try and convert to ints
    #         if len(londonparish) > 0:
    #             qlondonparish = int(londonparish)
    #             targetphrase = "parish_page"
    #             return redirect(targetphrase, qlondonparish)

    # else:
    #     form = LondonparishForm(initial=parishstats, instance=reference_set)


    context = {
        'pagetitle': pagetitle,
        'individual_object': individual_object,
        'relationship_object': relationship_object,
        'relationshipnumber' : relationshipnumber,
        # 'manifestation_set': manifestation_set,
        # 'totalrows': totalrows,
        # 'totaldisplay': totaldisplay,
        'parishes_dict': mapparishes,
        'reference_set': reference_set,
        # 'form': form,
        }

    template = loader.get_template('witness/person.html')
    return HttpResponse(template.render(context, request))

def entity(request, witness_entity_number):

    print(witness_entity_number)

    #create flag that this is a view operation....
    operation = 1
    application = 2

    #item = 0, seal=1, manifestation=2, sealdescription=3, etc...
    targetphrase = redirectgenerator(witness_entity_number, operation, application)

    print ("targetphrase", targetphrase)

    return redirect(targetphrase)

def parish_page(request, witness_entity_number):

    qlondonparish = witness_entity_number
 
    parish = Location.objects.get(id_location=qlondonparish)

    # # list of references to actors in parish
    # reference_set = Referenceindividual.objects.filter(
    #     fk_referencerole=1).filter(
    #     fk_event__fk_event_locationreference__fk_locationname__fk_location=qlondonparish).exclude(
    #     fk_individual=10000019)


    individual_set = Individual.objects.filter(
        fk_individual_event__fk_event__fk_event_locationreference__fk_locationname__fk_location=qlondonparish).annotate(occurences=
        Count('fk_individual_event'))

    case_value = individual_set.aggregate(Sum('occurences'))
    totalcases = case_value['occurences__sum']

    mapparishes = []

    ## data for colorpeth map
    mapparishes1 = get_object_or_404(Jsonstorage, id_jsonfile=2)
    mapparishes = json.loads(mapparishes1.jsonfiletxt)

    for i in mapparishes:
        if i == "features":
            for b in mapparishes[i]:
                t = b["properties"]
                if t["fk_locatio"] == parish.pk_location:
                    t["cases"] = totalcases
                    t["parishname"] = parish.location

    template = loader.get_template('witness/parish.html')
    context = {
        'parish': parish,
        'totalcases': totalcases,
        'individual_set': individual_set,
        'qlondonparish': qlondonparish,
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
        fk_event__in=parishevents).values(
        'fk_individual', 'fk_event', 'fk_individual__fullname_original').order_by('pk_referenceindividual')

    linkslist, nodelist = networkgenerator(reference_set)

    template = loader.get_template('witness/parish_graph.html')
    context = {
        'nodelist': nodelist,
        'linkslist': linkslist,
        }

    return HttpResponse(template.render(context, request))


def item_page(request, witness_entity_number):

    print (request)
    targetphrase = "parish_page"

    return redirect(targetphrase, 50013947)

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
        fk_event__in=witnessevents).values('fk_individual', 'fk_event', 'fk_individual__fullname_original').order_by('pk_referenceindividual')

    linkslist, nodelist = networkgenerator(reference_set)

    template = loader.get_template('witness/person_graph.html')
    context = {
        'nodelist': nodelist,
        'linkslist': linkslist,
        }

    return HttpResponse(template.render(context, request))