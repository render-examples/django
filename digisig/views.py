from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time

from .models import *



# Create your views here.
def index(request):
    # return render(request, 'sealquery/index.html', {})

    starttime = time()

    pagetitle = 'title'
    template = loader.get_template('digisig/index.html')

    #### update this to remove databasecall

    manifestation_total = Manifestation.objects.count()
    seal_total = Seal.objects.count()
    #item_total = Support.objects.distinct('fk_part__fk_item').count()
    catalogue_total = Sealdescription.objects.count()

    context = {
        'pagetitle': pagetitle,
        'manifestation_total': manifestation_total,
        'seal_total': seal_total,
        #'item_total': item_total,
        'catalogue_total': catalogue_total,
        }

    print("Compute Time:", time()-starttime)
    return HttpResponse(template.render(context, request))


#################### Search #########################
def search(request, searchtype):
    starttime = time()

###### Search Seal Descriptions ##########

    if searchtype == "sealdescriptions":

        sealdescription_object = Digisigsealdescriptionview.objects.all()
        pagetitle = 'Seal Descriptions'

        if request.method == 'POST':
            form = SealdescriptionForm(request.POST)
            if form.is_valid():
                challengeurl(request, searchtype, form)
                qcollection = form.cleaned_data['collection']   
                qcataloguecode = form.cleaned_data['cataloguecode']
                qcataloguemotif = form.cleaned_data['cataloguemotif']
                qcataloguename = form.cleaned_data['cataloguename']
                qpagination = form.cleaned_data['pagination']

                rows = sealdescription_object.count()

                if qcollection.isdigit():
                    if int(qcollection) > 0:
                        if int(qcollection) == 30000287:
                            print("all collections")
                        else: sealdescription_object = sealdescription_object.filter(fk_collection=qcollection)
                        
                        print (len(sealdescription_object))
                if len(qcataloguecode) > 0:
                    sealdescription_object = sealdescription_object.filter(sealdescription_identifier__icontains=qcataloguecode)
                    print (len(sealdescription_object))

                if len(qcataloguemotif) > 0:
                    sealdescription_object = sealdescription_object.filter(
                        Q(motif_obverse__contains=qcataloguemotif) | Q(motif_reverse__icontains=qcataloguemotif)
                        )
                    print (len(sealdescription_object))

                if len(qcataloguename) > 0:
                    sealdescription_object = sealdescription_object.filter(sealdescription_title__icontains=qcataloguename)
                    print (len(sealdescription_object))

                form = SealdescriptionForm(request.POST)



        else:
            form = SealdescriptionForm()
            qpagination = 1

        pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows, sealdescription_object = paginatorJM(qpagination, sealdescription_object)

        context = {
            'pagetitle': pagetitle,
            'sealdescription_object': sealdescription_object,
            'totalrows': totalrows,
            'totaldisplay': totaldisplay,
            'form': form,
            'pagecountercurrent': pagecountercurrent,
            'pagecounternext': pagecounternext,
            'pagecounternextnext': pagecounternextnext,
            }

        template = loader.get_template('sealquery/search_sealdescription.html')
        print("Compute Time:", time()-starttime)
        return HttpResponse(template.render(context, request))


### Search Places 
    
    if searchtype == "places":

        placeset = Location.objects.filter(locationname__locationreference__fk_locationstatus=1, longitude__isnull=False, latitude__isnull=False).order_by('location')

        pagetitle = 'Places'
        regionselect = False
        qpagination = 1
        place_dict = []
        center_long = 0
        center_lat = 55

        if request.method == 'POST':

            form = PlaceForm(request.POST)
            if form.is_valid():
                challengeurl(request, searchtype, form)
                qregion = form.cleaned_data['region']
                qcounty = form.cleaned_data['county']   
                qpagination = form.cleaned_data['pagination']
                qlocation_name = form.cleaned_data['location_name']

                if qregion.isdigit():
                    if int(qregion) > 0:
                        placeset = placeset.filter(fk_region__fk_regiondisplay=qregion)
                        regionselect = True

                if regionselect == False:
                    if qcounty.isdigit():
                        if int(qcounty) > 0:
                            placeset = placeset.filter(fk_region=qcounty)

                if len(qlocation_name) > 0:
                    placeset = placeset.filter(location__icontains=qlocation_name)                  

                form = PlaceForm(request.POST)

        else:
            form = PlaceForm()
            qpagination = 1

        placeset = placeset.annotate(count=Count('locationname__locationreference'))
        pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows, placeset = paginatorJM(qpagination, placeset)

        if len(placeset) > 0:
            place_dict, center_long, center_lat = mapgenerator2(placeset)

        context = {
            'pagetitle': pagetitle,
            'placeset': placeset,
            'place_dict': place_dict,
            'center_long': center_long,
            'center_lat': center_lat,
            'totalrows': totalrows,
            'totaldisplay': totaldisplay,
            'form': form,
            'pagecountercurrent': pagecountercurrent,
            'pagecounternext': pagecounternext,
            'pagecounternextnext': pagecounternextnext,
            }

        template = loader.get_template('sealquery/search_place.html')
        print("Compute Time:", time()-starttime)
        return HttpResponse(template.render(context, request))


### Search Seals

    if searchtype == "seals":

        pagetitle = 'Impressions, Matrices and Casts'

        manifestation_object = Manifestation.objects.all().order_by('id_manifestation')

        if request.method == 'POST':
            form = ManifestationForm(request.POST)
            if form.is_valid():
                challengeurl(request, searchtype, form)

                qrepository = form.cleaned_data['repository']   
                qseries = form.cleaned_data['series']
                qrepresentation_type = form.cleaned_data['representation']
                qnature = form.cleaned_data['nature']
                qlocation = form.cleaned_data['location']
                qtimegroup = form.cleaned_data['timegroup']
                qshape = form.cleaned_data['shape']
                qshelfmark = form.cleaned_data['name']
                qclassname = form.cleaned_data['classname']
                qpagination = form.cleaned_data['pagination']
                qgroup = form.cleaned_data['group']

                rows = manifestation_object.count()

                if qrepository.isdigit():
                    if int(qrepository) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_support__fk_part__fk_item__fk_repository=qrepository)

                if qseries.isdigit():
                    if int(qseries) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_support__fk_part__fk_item__fk_series=qseries)

                if qrepresentation_type.isdigit():
                    if int(qrepresentation_type) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_manifestation__fk_representation_type=qrepresentation_type)

                if qnature.isdigit():
                    if int(qnature) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_support__fk_nature=qnature)

                if qlocation.isdigit():
                    if int(qlocation) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_support__fk_part__fk_event__locationreference__fk_locationname__fk_location__fk_region=qlocation)

                if qtimegroup.isdigit():
                    if int(qtimegroup) > 0:
                        temporalperiod_target = (TimegroupA.objects.get(pk_timegroup_a = qtimegroup))   
                        yearstart = (temporalperiod_target.timegroup_a_startdate)
                        manifestation_object = manifestation_object.filter(
                            fk_support__fk_part__fk_event__repository_startdate__lt=datetime.strptime(str(yearstart), "%Y")).filter(
                            fk_support__fk_part__fk_event__repository_enddate__gt=datetime.strptime(str(yearstart+50), "%Y"))

                if qshape.isdigit():
                    if int(qshape) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_face__fk_shape=qshape)

                if qgroup.isdigit():
                    if int(qgroup) > 0:
                        manifestation_object = manifestation_object.filter(
                            fk_face__fk_seal__fk_printgroup=qgroup)

                if qclassname.isdigit():
                    if int(qclassname) > 0:
                        searchclassification =  Classification.objects.get(id_class = qclassname)
                        manifestation_object = manifestation_object.filter(
                            fk_face__fk_class__level1=searchclassification.level1)

                        if searchclassification.level2 > 0:
                            manifestation_object = manifestation_object.filter(
                            fk_face__fk_class__level2=searchclassification.level2)

                            if searchclassification.level3 > 0:
                                manifestation_object = manifestation_object.filter(
                                fk_face__fk_class__level3=searchclassification.level3)

                                if searchclassification.level4 > 0:
                                    manifestation_object = manifestation_object.filter(
                                    fk_face__fk_class__level4=searchclassification.level4)

                                    if searchclassification.level5 > 0:
                                        manifestation_object = manifestation_object.filter(
                                        fk_face__fk_class__level5=searchclassification.level5)

                                        if searchclassification.level6 > 0:
                                            manifestation_object = manifestation_object.filter(
                                            fk_face__fk_class__level6=searchclassification.level6)

                                            if searchclassification.level7 > 0:
                                                manifestation_object = manifestation_object.filter(
                                                fk_face__fk_class__level7=searchclassification.level7)


                if len(qshelfmark) > 0:
                    manifestation_object = manifestation_object.filter(
                        fk_support__fk_part__fk_item__shelfmark__icontains=qshelfmark)

                form = ManifestationForm(request.POST)

        else:
            form = ManifestationForm()
            qpagination = 1

        pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows, manifestation_object = paginatorJM(qpagination, manifestation_object)

        ## prepare the data for each displayed seal manifestation
        manifestation_set = manifestationmetadata(manifestation_object)

    # code prepares the array of series and repositories to pass to the frontend
        series_object= seriesset()

        context = {
            'pagetitle': pagetitle, 
            'manifestation_set': manifestation_set,
            'totalrows': totalrows,
            'totaldisplay': totaldisplay,
            'form': form,
            'pagecountercurrent': pagecountercurrent,
            'pagecounternext': pagecounternext,
            'pagecounternextnext': pagecounternextnext,
            'series_object': series_object,
            }

        template = loader.get_template('sealquery/search_seal.html')                    

        print("Compute Time:", time()-starttime)
        return HttpResponse(template.render(context, request))

### Search Item

    if searchtype == "items":

        pagetitle = 'title'

        #default values in case there is nothing specific in form or in else clause
        repository = 0
        series = 0
        shelfmark = ""
        searchphrase = ""
        pagination = 1

        if request.method == "POST":
            form = ItemForm(request.POST)

            if form.is_valid():
                challengeurl(request, searchtype, form)
                if form.cleaned_data['repository'].isdigit(): repository = int(form.cleaned_data['repository']) 
                if form.cleaned_data['series'].isdigit(): series = int(form.cleaned_data['series'])
                if len(form.cleaned_data['shelfmark']) > 0: shelfmark = form.cleaned_data['shelfmark']
                if len(form.cleaned_data['searchphrase']) > 0: searchphrase = form.cleaned_data['searchphrase']
                pagination = int(form.cleaned_data['pagination'])

        else:
            form = ItemForm()
            repository = 26
            series = 347
            form.initial["repository"] = 26
            form.initial["series"] = 347

        # code prepares the array of series and repositories to pass to the frontend
        series_object= seriesset()

        itemset, Repositorycases, Seriescases, Shelfmarkcases, Phrasecases, pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows \
        = itemsearch(repository, series, shelfmark, searchphrase, pagination)

        context = {
            'pagetitle': pagetitle,
            'itemset': itemset,
            'totalrows': totalrows,
            'totaldisplay': totaldisplay,
            'form': form,
            'Repositorycases': Repositorycases,
            'Seriescases': Seriescases,
            'Shelfmarkcases': Shelfmarkcases,
            'series_object': series_object,
            'Phrasecases': Phrasecases,
            'pagecountercurrent': pagecountercurrent,
            'pagecounternext': pagecounternext,
            'pagecounternextnext': pagecounternextnext,
            }

        template = loader.get_template('sealquery/search_item.html')
        print("Compute Time:", time()-starttime)
        return HttpResponse(template.render(context, request))


### Actor Search

    if searchtype == "actors":

        pagetitle = 'title'

        individual_object = Digisigindividualview.objects.all().order_by('group_name', 'descriptor_name')

        if request.method == "POST":
            form = PeopleForm(request.POST)
            if form.is_valid():
                challengeurl(request, searchtype, form)
                qname = form.cleaned_data['name']   
                qpagination = form.cleaned_data['pagination']
                qgroup = form.cleaned_data['group']
                qclass = form.cleaned_data['personclass']
                qorder = form.cleaned_data['personorder']

                if qgroup.isdigit():
                    qgroup = int(qgroup)
                    if int(qgroup) == 2: individual_object = individual_object.filter(corporateentity=True)
                    if int(qgroup) == 1: individual_object = individual_object.filter(corporateentity=False)

                if len(qname) > 0:
                    individual_object = individual_object.filter(
                        Q(group_name__icontains=qname) | Q(descriptor_name__icontains=qname) | Q(descriptor1__icontains=qname) | Q(descriptor2__icontains=qname) | Q(descriptor3__icontains=qname)
                        )

                if qclass.isdigit():
                    if int(qclass) > 0:
                        qclass = int(qclass)
                        individual_object = individual_object.filter(fk_group_class=qclass)

                if qorder.isdigit():
                    if int(qorder) > 0:
                        qorder = int(qorder)
                        individual_object = individual_object.filter(fk_group_order=qorder)

                form = PeopleForm(request.POST)

        else:
            form = PeopleForm()
            qpagination = 1


    # preparing the data for individual_object
        qpaginationend = int(qpagination) * 10
        qpaginationstart = int(qpaginationend) -9 
        totalrows = len(individual_object)

        # if the dataset is less than the page limit
        if qpaginationend > totalrows:
            qpaginationend = totalrows

        if totalrows > 1:
            if qpaginationend < 10:
                print(totalrows)
            else:
                individual_object = individual_object[qpaginationstart:qpaginationend]
        totaldisplay = str(qpaginationstart) + " - " + str(qpaginationend)

        pagecountercurrent = qpagination
        pagecounternext = int(qpagination)+1
        pagecounternextnext = int(qpagination)+2

    # this code prepares the list of links to associated seals for each individual
        sealindividual = []
        for e in individual_object:
            testvalue = e.id_individual
            testseal = Seal.objects.filter(
                fk_individual_realizer=testvalue)

            for f in testseal:
                current_id_seal = f.id_seal
                sealindividual.append((testvalue, current_id_seal))

        context = {
            'pagetitle': pagetitle,
            'individual_object': individual_object,
            'sealindividual': sealindividual,
            'totalrows': totalrows,
            'totaldisplay': totaldisplay,
            'form': form,
            'pagecountercurrent': pagecountercurrent,
            'pagecounternext': pagecounternext,
            'pagecounternextnext': pagecounternextnext,
            }

        template = loader.get_template('sealquery/search_actor.html')
        print("Compute Time:", time()-starttime)
        return HttpResponse(template.render(context, request))
