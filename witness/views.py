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
    targetphrase = "parish"

    return redirect(targetphrase)

def parish(request):

    linkslist = []
    nodelist = []

    parishevents = Location.objects.filter(id_location=50013947).values('locationname__locationreference__fk_event')

    reference_set = Referenceindividual.objects.filter(
        fk_referencerole=1).exclude(fk_individual=10000019).filter(
        fk_event__in=parishevents).values('fk_individual', 'fk_event', 'fk_individual__fullname_original').order_by('pk_referenceindividual')

    reference_dic = {}
    person_dic = {}
    personlist = []
    

    for r in reference_set:

        if r['fk_event'] in reference_dic:
            eventid = r['fk_event']
            reference_dic[eventid].append(r['fk_individual'])
        else:
            eventid = r['fk_event']
            reference_dic[eventid] = [r['fk_individual']]

        person = r['fk_individual']

        if person == 10000459:
            print ("found him")

        nameoriginal = r['fk_individual__fullname_original']
        valuetarget = 1

        if person in personlist:
            x=personlist.index(person)
            case = nodelist[x]
            currentvalue = case['val']
            nodelist.pop(x)
            nodelist.insert(x, {'id':person, 'name': nameoriginal, 'val': currentvalue+1})
            # nodelist.insert(x, {'id':person})

        else:
            personlist.append(person)
            nodelist.append({'id':person, 'name': nameoriginal, 'val': valuetarget})
            # nodelist.append({'id':person})

    for r in reference_dic:
        targetset = reference_dic[r]
        numberofpeople = len(reference_dic[r])

        for x in range(numberofpeople):
            for y in range(x+1, numberofpeople):
                person1 = targetset[x]
                person2 = targetset[y]
                linkslist.append({'source': person1, 'target': person2})

    # print (nodelist[0])
    # print (linkslist[0])

    template = loader.get_template('witness/parish.html')
    context = {
        'nodelist': nodelist,
        'linkslist': linkslist,
        }

    return HttpResponse(template.render(context, request))