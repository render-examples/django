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


def graph(request):

    parishevents = Location.objects.filter(id_location=50013947).values('locationname__locationreference__fk_event')

    reference_set = Referenceindividual.objects.filter(
        fk_referencerole=1).exclude(fk_individual=10000019).filter(
        fk_event__in=parishevents).values('fk_individual', 'fk_event').order_by('pk_referenceindividual')

    reference_dic = {}

    for r in reference_set:
        if r['fk_event'] in reference_dic:
            eventid = r['fk_event']
            reference_dic[eventid].append(r['fk_individual'])
        else:
            eventid = r['fk_event']
            reference_dic[eventid] = [r['fk_individual']]

    for r in reference_dic:
        numberofpeople = len(reference_dic[r])

        person1 = 

        for x in range(numberofpeople):
            for y in range(x+1, numberofpeople):


                person1 = targetset[x]['fk_individual']
                person2 = targetset[y]['fk_individual']
                linkslist.append({'source': person1, 'target': person2})



    personlinks = reference_set.distinct('fk_individual').values('fk_individual')

    individual_set = Individual.objects.filter(
        id_individual__in=personlinks).values(
        id=F('id_individual'), name=F('fullname_original')).annotate(
        val=Count("id_individual"))

    nodelist = list(individual_set)

    linkslist = []


    graphdata = {"nodes": [{"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}],"links":[{"source":10000029,"target":10001029}]}

    template = loader.get_template('witness/graph.html')
    context = {
        'graphdata': graphdata,
        'nodelist': nodelist,
        'linkslist': linkslist,
        }




    # parishevents = Location.objects.filter(id_location=50013947).values('locationname__locationreference__fk_event')

    # reference_set = Referenceindividual.objects.filter(
    #     fk_referencerole=1).filter(
    #     fk_event__in=parishevents).values('fk_individual', 'fk_event')

    # reference_dic = {}

    # for r in reference_set:
    #     if r['fk_event'] in reference_dic:
    #         eventid = r['fk_event']
    #         reference_dic[eventid].append(r['fk_individual'])
    #     else:
    #         eventid = r['fk_event']
    #         reference_dic[eventid] = [r['fk_individual']]

    # personlinks = reference_set.distinct('fk_individual').values('fk_individual')

    # individual_set = Individual.objects.filter(
    #     id_individual__in=personlinks).values(
    #     id=F('id_individual'), name=F('fullname_original')).annotate(
    #     val=Count("id_individual"))

    # nodelist = list(individual_set)

    # linkslist = []

    # reference_set2 = reference_set.values_list()

    # # print (reference_set2)

    # for r in parishevents:
    #     personlinks = reference_set.filter(
    #         fk_event=r["locationname__locationreference__fk_event"]).exclude(fk_individual=10000019).distinct('fk_individual').values('fk_individual')

    #     peoplelist = list(personlinks)

    #     targetset = peoplelist

    #     numberofpeople = len(targetset)

    #     for x in range(numberofpeople):
    #         for y in range(x+1, numberofpeople):
    #             person1 = targetset[x]['fk_individual']
    #             person2 = targetset[y]['fk_individual']
    #             linkslist.append({'source': person1, 'target': person2})

    # graphdata = {"nodes": [{"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}],"links":[{"source":10000029,"target":10001029}]}

    # template = loader.get_template('witness/graph.html')
    # context = {
    #     'graphdata': graphdata,
    #     'nodelist': nodelist,
    #     'linkslist': linkslist,
    #     }
    # return HttpResponse(template.render(context, request))



    ## all the people in a particular event
    # sourcevalue = 3143

    # graphdata = {}

    # personlinks = Referenceindividual.objects.filter(
    #     fk_referencerole=1).filter(
    #     fk_event=sourcevalue).distinct('fk_individual').values('fk_individual')

    # peoplelist = list(personlinks)

    # targetset = peoplelist

    # numberofpeople = len(targetset)
    # linkslist = []

    # for x in range(numberofpeople):
    #     for y in range(x+1, numberofpeople):
    #         person1 = targetset[x]['fk_individual']
    #         person2 = targetset[y]['fk_individual']
    #         linkslist.append({'source': person1, 'target': person2})

    # # print (linkslist)

    # # links_set= personlinks.annotate(source=Value(sourcevalue, output_field=IntegerField()))

    # # linkslist = list(links_set)

    # individual_set = Individual.objects.filter(
    #     id_individual__in=personlinks).values(
    #     id=F('id_individual'), name=F('fullname_original')).annotate(
    #     val=Count("id_individual"))

    # nodelist = list(individual_set)

    # #graphdata = {"nodes": [{"id":"id1","name":"name1","val": 1},{"id":"id2","name":"name2","val": 10}],"links":[{"source":"id1","target":"id2"}]}

    # graphdata = {"nodes": [{"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}],"links":[{"source":10000029,"target":10001029}]}

    # # linkslist = {"source":10000029,"target":10001029}

    # # nodelist = {"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}

    # template = loader.get_template('witness/graph.html')
    # context = {
    #     'graphdata': graphdata,
    #     'nodelist': nodelist,
    #     'linkslist': linkslist,
    #     }
    # return HttpResponse(template.render(context, request))




    #     #version1 -- for finding all the people that a particular person witnesses with
    # sourcevalue = 10000029

    # graphdata = {}

    # personprimeevents = Referenceindividual.objects.filter(fk_individual=sourcevalue, fk_referencerole=1).values('fk_event')

    # personlinks = Referenceindividual.objects.filter(
    #     fk_event__in=personprimeevents, fk_referencerole=1).values(target=F('fk_individual'))

    # links_set= personlinks.annotate(source=Value(sourcevalue, output_field=IntegerField()))

    # linkslist = list(links_set)

    # individual_set = Individual.objects.filter(
    #     id_individual__in=personlinks).values(
    #     id=F('id_individual'), name=F('fullname_original')).annotate(
    #     val=Count("id_individual"))

    # nodelist = list(individual_set)

    # #graphdata = {"nodes": [{"id":"id1","name":"name1","val": 1},{"id":"id2","name":"name2","val": 10}],"links":[{"source":"id1","target":"id2"}]}

    # graphdata = {"nodes": [{"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}],"links":[{"source":10000029,"target":10001029}]}

    # # linkslist = {"source":10000029,"target":10001029}

    # # nodelist = {"id":10000029,"name":"John de Gisors","val": 1},{"id":10001029,"name":"Michael Tovy","val": 10}

    # template = loader.get_template('witness/graph.html')
    # context = {
    #     'graphdata': graphdata,
    #     'nodelist': nodelist,
    #     'linkslist': linkslist,
    #     }
    # return HttpResponse(template.render(context, request))