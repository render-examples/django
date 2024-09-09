from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, JsonResponse
from django.template import loader
from django.urls import reverse
from datetime import datetime
from time import time
# from django.core.paginator import Paginator
from django.db.models import Prefetch


from .models import *
from .forms import * 
# from utils.mltools import * 
from utils.generaltools import *
from utils.viewtools import *

# Create your views here.
def index(request):
	# return render(request, 'digisig/index.html', {})

	starttime = time()

	pagetitle = 'title'
	template = loader.get_template('digisig/index.html')

	#### update this to remove databasecall

	manifestation_total = Manifestation.objects.count()
	seal_total = Seal.objects.count()
	#item_total = Support.objects.distinct('fk_part__fk_item').count()
	item_total = 53408
	catalogue_total = Sealdescription.objects.count()

	context = {
		'pagetitle': pagetitle,
		'manifestation_total': manifestation_total,
		'seal_total': seal_total,
		'item_total': item_total,
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

		template = loader.get_template('digisig/search_sealdescription.html')
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

		template = loader.get_template('digisig/search_place.html')
		print("Compute Time:", time()-starttime)
		return HttpResponse(template.render(context, request))


### Search Seals

	if searchtype == "seals":

		pagetitle = 'Impressions, Matrices and Casts'

		if request.method == 'POST':
			manifestation_object, form = sealsearch()
			totalrows = manifestation_object.count()

		else:
			manifestation_object = Manifestation.objects.all().select_related(
				'fk_face__fk_seal').select_related(
				'fk_support__fk_part__fk_item__fk_repository').select_related(
				'fk_support__fk_number_currentposition').select_related(
				'fk_support__fk_attachment').select_related(
				'fk_support__fk_supportstatus').select_related(
				'fk_support__fk_nature').select_related(
				'fk_imagestate').select_related(
				'fk_position').select_related(
				'fk_support__fk_part__fk_event').order_by(
				'id_manifestation').prefetch_related(
				Prefetch('fk_manifestation', queryset=Representation.objects.filter(primacy=1)))[:10]

			totalrows = Manifestation.objects.count()			
			form = ManifestationForm()
			qpagination = 1

		pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay = paginatorJM(qpagination, totalrows, manifestation_object)

		## prepare the data for each displayed seal manifestation
		manifestation_set = sealsearchmanifestationmetadata(manifestation_object)

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

		template = loader.get_template('digisig/search_seal.html')                    

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

		template = loader.get_template('digisig/search_item.html')
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

		template = loader.get_template('digisig/search_actor.html')
		print("Compute Time:", time()-starttime)
		return HttpResponse(template.render(context, request))


######################### information ################################

def information(request, infotype):

	print (infotype)

############ Terminology ###############

	if infotype =="terminology":
		pagetitle = 'Terminology'

		## code for assembling the classification data
		term_object = Terminology.objects.filter(
			term_deprecated=0, level__isnull=False).order_by('term_sortorder')

		termobject = []
		toplevel = term_object.filter(level=1)

		fifthset = {}
		topset = {}
		level5 = {}
		level4= {}
		level3= {}
		level2= {}
		level1= {}

		#images for display
		exampleset1 = {}
		exampleset2 = {}
		exampleset3 = {}
		exampleset4 = {}
		exampleset5 = {}

		for t in toplevel:
			target1 = t.level1
			name1 = t.term_name
			idterm1 = t.id_term
			tooltip1 = t.term_definition
			exampleset1= examplefinder(idterm1)

			secondlevel = term_object.filter(level=2, level1=target1)
			for s in secondlevel:
				target2 = s.level2
				name2 = s.term_name
				idterm2 = s.id_term
				tooltip2 = s.term_definition
				exampleset2 = examplefinder(idterm2)

				thirdlevel = term_object.filter(level=3, level2=target2)
				for th in thirdlevel:
					target3 = th.level3
					name3 = th.term_name
					idterm3 = th.id_term
					tooltip3 = th.term_definition
					exampleset3 = examplefinder(idterm3)

					fourthlevel = term_object.filter(level=4, level3=target3)
					for fo in fourthlevel:
						target4 = fo.level4
						name4 = fo.term_name
						idterm4 = fo.id_term
						tooltip4 = fo.term_definition
						exampleset4 = examplefinder(idterm4)

						fifthlevel = term_object.filter(level=5, level4=target4)
						for fi in fifthlevel:
							name5 = fi.term_name
							idterm5 = fi.id_term
							tooltip5 = fi.term_definition
							exampleset5 = examplefinder(idterm5)
							fifthset[name5] = {"id_term": idterm5, "examples": exampleset5, "tooltip": tooltip5}
							exampleset5 = {}
		
						level4[name4] = {"id_term": idterm4, "children": fifthset, "examples": exampleset4, "tooltip": tooltip4}
						fifthset = {}
						exampleset4 = {}
		
					level3[name3] = {"id_term": idterm3, "children": level4, "examples": exampleset3, "tooltip": tooltip3}
					level4= {}
					exampleset3 = {}
	
				level2[name2] = {"id_term": idterm2, "children":level3, "examples": exampleset2, "tooltip": tooltip2}
				level3 = {}
				exampleset2 = {}

			topset[name1] = {"id_term": idterm1, "children": level2, "examples": exampleset1, "tooltip": tooltip1}
			level2 = {}


		## code for assembling the shape data
		shapeterms = Terminology.objects.filter(digisig_column="shape").order_by("term_name")
	
		shapeset = {}
		for s in shapeterms:
			nameshape = s.term_name
			shapeterm = s.id_term
			tooltip = s.term_definition
			examplesetshape = examplefinder(shapeterm)
			shapeset[nameshape] = {"id_term": shapeterm, "examples":examplesetshape, "tooltip": tooltip}

		## code for assembling the nature data
		natureterms = Terminology.objects.filter(digisig_column="nature").order_by("term_name")
	
		natureset = {}
		for n in natureterms:
			namenature = n.term_name
			natureterm = n.id_term
			tooltip = n.term_definition
			examplesetnature = examplefinder(natureterm)
			natureset[namenature] = {"id_term": natureterm, "examples":examplesetnature, "tooltip": tooltip}


		## code for assembling the general data
		generalterms = Terminology.objects.filter(digisig_column="general").order_by("term_name")

		generalset = {}
		for g in generalterms:
			namegeneral = g.term_name
			generalterm = g.id_term
			tooltip = g.term_definition
			examplesetgeneral = examplefinder(generalterm)
			generalset[namegeneral] = {"id_term": generalterm, "examples":examplesetgeneral, "tooltip": tooltip}


		context = {
			'generalobject': generalset,
			'natureobject': natureset,
			'classterms': topset,
			'shapeobject': shapeset,
			'pagetitle': pagetitle,
			'term_object': term_object,
			}
		template = loader.get_template('digisig/terminology.html')                    
		return HttpResponse(template.render(context, request))


############################## ENTITY #########################

def entity(request, digisig_entity_number):

	print(digisig_entity_number)

	#create flag that this is a view operation....
	operation = 1

	#item = 0, seal=1, manifestation=2, sealdescription=3, etc...
	targetphrase = redirectgenerator(digisig_entity_number, operation)

	print ("targetphrase", targetphrase)

	return redirect(targetphrase)

################################ TERM ######################################

def term_page(request, digisig_entity_number):
	pagetitle = 'Term'

	term_object = get_object_or_404(Terminology, id_term=digisig_entity_number)
	statement_object = Digisigskosdataview.objects.filter(skos_data_subject=digisig_entity_number)

	template = loader.get_template('digisig/term.html')
	context = {
		'pagetitle': pagetitle,
		'term_object': term_object,
		'statement_object': statement_object,
		}

	return HttpResponse(template.render(context, request))



############################## ENTITY #########################

def entity(request, digisig_entity_number):

	print(digisig_entity_number)

	#create flag that this is a view operation....
	operation = 1

	#item = 0, seal=1, manifestation=2, sealdescription=3, etc...
	targetphrase = redirectgenerator(digisig_entity_number, operation)

	print ("targetphrase", targetphrase)

	return redirect(targetphrase)


def entity_fail(request, entity_phrase):
	pagetitle = 'title'

	print(entity_phrase)
	return HttpResponse("%s is not an entity I know about." % entity_phrase)


############################## ITEM #############################

def item_page(request, digisig_entity_number):
	starttime = time()
	authenticationstatus = "public"

	manifestation_object = Manifestation.objects.filter(fk_support__fk_part__fk_item=digisig_entity_number).select_related(
		'fk_face__fk_seal').select_related(
		'fk_support__fk_part__fk_item__fk_repository').select_related(
		'fk_support__fk_number_currentposition').select_related(
		'fk_support__fk_attachment').select_related(
		'fk_support__fk_supportstatus').select_related(
		'fk_support__fk_nature').select_related(
		'fk_imagestate').select_related(
		'fk_position').select_related(
		'fk_support__fk_part__fk_event').order_by(
		'id_manifestation').prefetch_related(
		Prefetch('fk_manifestation', queryset=Representation.objects.filter(primacy=1))).order_by(
		"fk_support__fk_number_currentposition")

	firstmanifestation = manifestation_object.first()
	item_object = firstmanifestation.fk_support.fk_part.fk_item
	part_object = firstmanifestation.fk_support.fk_part
	event_object = firstmanifestation.fk_support.fk_part.fk_event

	pagetitle = item_object.fk_repository.repository_fulltitle + " " + item_object.shelfmark

	location, location_dict, event_dic = eventset_data(event_object, part_object)

	place_object = event_dic["location"]
	mapdic = mapgenerator(place_object, 0)
	externallinkset = externallinkgenerator(digisig_entity_number)

	#for part images (code to show images not implemented yet)
	representationset = []

	try: 
		representation_part = Representation.objects.filter(fk_digisig__in=part_object).select_related
		representationset = representation_photographs(representation_part)
















	#find manifestations associated with item
	#manifestation_object = Manifestation.objects.filter(fk_support__fk_item=digisig_entity_number).order_by("fk_support__fk_number_currentposition")

	## prepare the data for each displayed seal manifestation
	manifestationset = manifestationmetadata(manifestation_object)
	totalrows = len(manifestationset)
	totaldisplay = len(manifestationset)

	print("Compute Time:", time()-starttime)

	template = loader.get_template('digisig/item.html')
	context = {
		'pagetitle': pagetitle,
		'authenticationstatus': authenticationstatus,
		'item_object': item_object,
		'event_dic': event_dic,
		'mapdic': mapdic,
		'representationset': representationset,
		'manifestation_set': manifestationset,
		'totalrows': totalrows,
		'totaldisplay': totaldisplay,
		'externallink_object': externallinkset,
		'location': location,
		'location_dict': location_dict,
		}

	# else:

	# 	print("Compute Time:", time()-starttime)

	# 	template = loader.get_template('digisig/item_simple.html')
	# 	context = {
	# 		'pagetitle': pagetitle,
	# 		'authenticationstatus': authenticationstatus,
	# 		'item_object': item_object,
	# 		}

	return HttpResponse(template.render(context, request))


############################## Seal #############################


def seal_page(request, digisig_entity_number):
	pagetitle = 'title'

	starttime = time()

	seal_object = get_object_or_404(Seal, id_seal=digisig_entity_number)

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/seal.html')

	else:
		authenticationstatus = "public"
		template = loader.get_template('digisig/seal_simple.html')

	seal_info = sealmetadata(seal_object, authenticationstatus)

	context = {
		'pagetitle': pagetitle,
		'seal_info': seal_info,
		}

	print("Compute Time:", time()-starttime)
	return HttpResponse(template.render(context, request))

############################ Manifestation #####################


def manifestation_page(request, digisig_entity_number): 
	pagetitle = 'title'

	starttime = time()

	manifestation_object = get_object_or_404(Manifestation, id_manifestation=digisig_entity_number)

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/manifestation.html')

		face_object = manifestation_object.fk_face
		seal_object = face_object.fk_seal
		sealdescription_set = Sealdescription.objects.filter(fk_seal=seal_object)
		location_reference_object = Locationreference.objects.get(fk_event=manifestation_object.fk_support.fk_part.fk_event, fk_locationstatus=1)
		
		try:
			region = location_reference_object.fk_locationname.fk_location.fk_region.region_label
		except:
			region = "Undetermined"
			
		try:
			representation_object = Representation.objects.get(fk_digisig=digisig_entity_number, primacy=1)
		except:
			#add graphic of generic seal 
			representation_object = Representation.objects.get(id_representation=12132404)

		externallink_object = Digisiglinkview.objects.filter(fk_digisigentity=digisig_entity_number)

		individualtarget = seal_object.fk_individual_realizer
		outname = namecompiler(individualtarget)

		context = {
				'authenticationstatus': authenticationstatus,
				'pagetitle': pagetitle,
				'manifestation_object': manifestation_object,
				'representation_object': representation_object,
				'region': region,
				'seal_object': seal_object,
				'individualtarget': individualtarget.id_individual,
				'sealdescription_object': sealdescription_set,
				'externallink_object': externallink_object,
				'outname': outname,
				# 'rdftext': rdftext,
		}

	else:
		authenticationstatus = "public"
		template = loader.get_template('digisig/manifestation_simple.html')

		context = {
				'pagetitle': pagetitle,
				'manifestation_object': manifestation_object,
		}

	print("Compute Time:", time()-starttime)
	return HttpResponse(template.render(context, request))

############################## Seal description #############################


def sealdescription_page(request, digisig_entity_number):

	starttime = time()
	sealdescription_object = get_object_or_404(Digisigsealdescriptionview, id_sealdescription=digisig_entity_number)
	pagetitle = sealdescription_object.collection_title

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/sealdescription.html')

		collectioncontributors = Collectioncontributor.objects.filter(fk_collection=sealdescription_object.fk_collection)
		contributorset = contributorgenerate(collectioncontributors)

		externallinkset = externallinkgenerator(digisig_entity_number)

		context = {
			'pagetitle': pagetitle,
			'sealdescription_object': sealdescription_object,
			'contributorset': contributorset,
			'externallinkset': externallinkset, 
			}

	else:
		authenticationstatus = "public"
		template = loader.get_template('digisig/sealdescription_simple.html')

		context = {
			'pagetitle': pagetitle,
			'sealdescription_object': sealdescription_object,
			}

	print("Compute Time:", time()-starttime)
	return HttpResponse(template.render(context, request))


############################## representation #############################


def representation_page(request, digisig_entity_number):

	starttime = time()
	pagetitle = 'Representation'

	representation_object = get_object_or_404(Representation, id_representation=digisig_entity_number)

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/representation.html')
		representation_dic = representationmetadata(representation_object, authenticationstatus)

	else:
		authenticationstatus = "public"
		representation_dic = representationmetadata(representation_object, authenticationstatus)
		template = loader.get_template('digisig/representation_simple.html')

	context = {
		'pagetitle': pagetitle,
		'representation_dic': representation_dic,
		}

	print("Compute Time:", time()-starttime)
	return HttpResponse(template.render(context, request))


############################## support #############################


############################## face #############################


################################ TERM ######################################


def term_page(request, digisig_entity_number):
	pagetitle = 'Term'

	term_object = get_object_or_404(Terminology, id_term=digisig_entity_number)
	statement_object = Digisigskosdataview.objects.filter(skos_data_subject=digisig_entity_number)

	template = loader.get_template('digisig/term.html')
	context = {
		'pagetitle': pagetitle,
		'term_object': term_object,
		'statement_object': statement_object,
		}

	return HttpResponse(template.render(context, request))



################################ Collection ######################################


def collection_page(request, digisig_entity_number):
	pagetitle = 'Collection'

	### This code prepares collection info box and the data for charts on the collection page

	print ("Progress")
	#defaults
	qcollection = int(digisig_entity_number)
	data = []
	labels = []
	pagetitle = 'All Collections'
	collectioninfo= []
	collection = get_object_or_404(Collection, id_collection=qcollection)
	collectioncontributors = Collectioncontributor.objects.filter(fk_collection=qcollection)

	contributorset = contributorgenerate(collectioncontributors)

	#if collection is set then limit the scope of the dataset
	if (qcollection == 30000287):
		sealdescriptionset = Sealdescription.objects.filter(fk_seal__gt=1)
		sealset = Seal.objects.all()
		faceset = Face.objects.filter(fk_faceterm=1)

		#total count to enable calculation of portion of entries with place info
		# placecount = Manifestation.objects.filter(
		#   fk_support__fk_part__fk_event__locationreference__fk_locationstatus__isnull=False).values().distinct().count()

		#total number cases that have NOT been assigned to a location (yet) --- 7042 = not assigned --- location status =2 is a secondary location
		casecount = Locationname.objects.exclude(
			pk_locationname=7042).exclude(
			locationreference__fk_locationstatus=2).filter(
			locationreference__fk_event__part__fk_part__fk_support__gt=1).count()

		#total portion of entries with place info
		placecount = Locationname.objects.exclude(
			locationreference__fk_locationstatus=2).filter(
			locationreference__fk_event__part__fk_part__fk_support__gt=1).count()

		#data for map counties
		# placeset = Region.objects.filter(fk_locationtype=4).annotate(numplaces=Count('location__locationname__locationreference', 
		#   filter=Q(location__locationname__locationreference__fk_locationstatus=1)))
		placeset = Region.objects.filter(fk_locationtype=4, 
			location__locationname__locationreference__fk_locationstatus=1
			).annotate(numplaces=Count('location__locationname__locationreference__fk_event__part__fk_part__fk_support')) 

		#data for map regions -- not active?
		# regiondisplayset = Regiondisplay.objects.annotate(numregions=Count('region__location__locationname__locationreference', 
		#   filter=Q(region__location__locationname__locationreference__fk_locationstatus=1)))
		regiondisplayset = Regiondisplay.objects.filter(region__location__locationname__locationreference__fk_locationstatus=1
			).annotate(numregions=Count('region__location__locationname__locationreference__fk_event__part__fk_part__fk_support')) 

	else:
		sealdescriptionset = Sealdescription.objects.filter(fk_collection=qcollection)
		sealset = Seal.objects.filter(sealdescription__fk_collection=qcollection)
		faceset = Face.objects.filter(fk_seal__sealdescription__fk_collection=qcollection).filter(fk_faceterm=1)
		pagetitle = collection.collection_title

		#total count to enable calculation of portion of entries with place info
		# placecount = Manifestation.objects.filter(
		#   fk_face__fk_seal__sealdescription__fk_collection=qcollection).filter(
		#   fk_support__fk_part__fk_event__locationreference__fk_locationstatus__isnull=False).values().distinct().count()

		#total number cases that have NOT been assigned to a location (yet) --- 7042 = not assigned
		casecount = Locationname.objects.exclude(
			pk_locationname=7042).exclude(
			locationreference__fk_locationstatus__isnull=True).filter(
			locationreference__fk_event__part__fk_part__fk_support__fk_face__fk_seal__sealdescription__fk_collection=qcollection).count()

		#total portion of entries with place info
		placecount = Locationname.objects.exclude(
			locationreference__fk_locationstatus__isnull=True).filter(
			locationreference__fk_event__part__fk_part__fk_support__fk_face__fk_seal__sealdescription__fk_collection=qcollection).count()

		#data for map counties
		#original
		# placeset = Region.objects.filter(fk_locationtype=4).annotate(numplaces=Count('location__locationname__locationreference', 
		#   filter=Q(location__locationname__locationreference__fk_locationstatus=1) & 
		#   Q(location__locationname__locationreference__fk_event__part__support__manifestation__fk_face__fk_seal__sealdescription__fk_collection=qcollection)))
		#revised
		placeset = Region.objects.filter(fk_locationtype=4, 
			location__locationname__locationreference__fk_locationstatus=1, 
			location__locationname__locationreference__fk_event__part__fk_part__fk_support__fk_face__fk_seal__sealdescription__fk_collection=qcollection
			).annotate(numplaces=Count('location__locationname__locationreference'))

		# #data for region map 
		# regiondisplayset = Regiondisplay.objects.annotate(numregions=Count('region__location__locationname__locationreference', 
		#   filter=Q(region__location__locationname__locationreference__fk_locationstatus=1) & 
		#   Q(region__location__locationname__locationreference__fk_event__part__support__manifestation__fk_face__fk_seal__sealdescription__fk_collection=qcollection)))

		#data for region map 
		regiondisplayset = Regiondisplay.objects.filter( 
			region__location__locationname__locationreference__fk_locationstatus=1, 
			region__location__locationname__locationreference__fk_event__part__fk_part__fk_support__fk_face__fk_seal__sealdescription__fk_collection=qcollection
			).annotate(numregions=Count('region__location__locationname__locationreference'))

	sealcount = sealset.count()
	facecount = faceset.count()
	classcount = faceset.filter(fk_class__isnull=False).exclude(fk_class=10000367).exclude(fk_class=10001007).count()

	# placecounttotal = 0
	# for i in placeset:
	#   placecounttotal = placecounttotal + i.numplaces

	collectioninfo = collectiondata(qcollection, sealcount)

	### generate the collection info data for chart 1 'Percentage of complete entries',
	sealdescriptioncount = sealdescriptionset.count()
	sealdescriptiontitle = sealdescriptionset.filter(sealdescription_title__isnull=False).count()
	sealdescriptionmotif = sealdescriptionset.filter(motif_obverse__isnull=False).count()
	sealdescriptionidentifier = sealdescriptionset.filter(sealdescription_identifier__isnull=False).count()

	actorscount = sealset.filter(fk_individual_realizer__gt=10000019).count()
	datecount =sealset.filter(date_origin__gt=1).count()

	title = calpercent(sealdescriptioncount, sealdescriptiontitle)
	motif = calpercent(sealdescriptioncount, sealdescriptionmotif)
	identifier = calpercent(sealdescriptioncount, sealdescriptionidentifier)
	actors = calpercent(sealcount, actorscount)
	date = calpercent(sealcount, datecount)
	fclass = calpercent(facecount, classcount)
	#place = calpercent(placecount, placecounttotal)
	place = calpercent(placecount, casecount)


	#9/9/2022 -- decided to limit the info to actor, date, class, place
	# data1 = [title, motif, identifier, actors, date, fclass, place]
	# labels1 = ["title", "description", "identifier", "actor", "date", "class", "place"]

	data1 = [actors, date, fclass, place]
	labels1 = ["actor", "date", "class", "place"]



	### generate the collection info data for chart 2 -- 'Percentage of seals per class',

	if (qcollection == 30000287):
		classset = Classification.objects.order_by('-level').annotate(numcases=Count('face')).exclude(id_class=10001007).exclude(id_class=10000367)
	else:
		classset = Classification.objects.order_by('-level').filter(face__fk_seal__sealdescription__fk_collection=qcollection).annotate(numcases=Count('face')).exclude(id_class=10001007).exclude(id_class=10000367)

	data2, labels2 = classdistribution(classset, facecount)



	### generate the collection info data for chart 3  -- 'Percentage of seals by period',

	data3, labels3 = datedistribution(sealset)



	### generate the collection info data for chart 4 -- seals per region,

	## data for colorpeth map
	maplayer1 = get_object_or_404(Jsonstorage, id_jsonfile=1)
	maplayer = json.loads(maplayer1.jsonfiletxt)

	for i in maplayer:
		if i == "features":
			for b in maplayer[i]:
				j = b["properties"]
				countyvalue = j["HCS_NUMBER"]
				countyname = j["NAME"]

				numberofcases = placeset.filter(fk_his_countylist=countyvalue)

				for i in numberofcases:
					j["cases"] = i.numplaces


	## data for region map
	# make circles data -- defaults -- note that this code is very similar to the function mapdata2
	region_dict = mapgenerator3(regiondisplayset)

	# mapdic = {"type": "FeatureCollection"}
	# properties = {}
	# geometry = {}
	# location = {}
	# regionlist = []



	# #for circles
	# for r in regiondisplayset:
	#   if (r.numregions > 0):
	#       data4.append(r.numregions)
	#       labels4.append(r.regiondisplay_label)

	#       value1 = r.id_regiondisplay
	#       value2 = r.regiondisplay_label
	#       value3 = r.numregions
	#       value4 = r.regiondisplay_long
	#       value5 = r.regiondisplay_lat

	#       popupcontent = str(value2)

	#       if value3 > 0:
	#           popupcontent = popupcontent + ' ' + str(value3)

	#       properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
	#       geometry = {"type": "Point", "coordinates": [value4, value5]}
	#       location = {"type": "Feature", "properties": properties, "geometry": geometry}

	#       regionlist.append(location)

	# mapdic["features"] = regionlist

	# data4 = []
	# labels4 = []

	### generate the collection info data for chart 5 --  'Percentage of actors per class',

	#for print group totals (legacy)
	if (qcollection == 30000287):
		printgroupset = Printgroup.objects.annotate(numcases=Count('fk_printgroup', filter=Q(fk_printgroup__sealdescription__fk_collection__gte=0))).order_by('printgroup_order')

	else: printgroupset = Printgroup.objects.annotate(numcases=Count('fk_printgroup', filter=Q(fk_printgroup__sealdescription__fk_collection=qcollection))).order_by('printgroup_order')

	#for modern group system
	if (qcollection == 30000287):
		groupset = Groupclass.objects.annotate(numcases=Count('id_groupclass', filter=Q(fk_group_class__fk_group__fk_actor_group__sealdescription__fk_collection__gte=0))).order_by('id_groupclass')

	else:
		groupset = Groupclass.objects.annotate(numcases=Count('id_groupclass', filter=Q(fk_group_class__fk_group__fk_actor_group__sealdescription__fk_collection=qcollection))).order_by('id_groupclass')

	data5 = []
	labels5 = []
	for g in groupset:
		if (g.numcases > 0):
			percentagedata = (g.numcases/sealcount)*100 
			# if percentagedata > 1:
			data5.append(percentagedata)
			labels5.append(g.groupclass)

	form = CollectionForm(initial={'collection': collection.id_collection})     
	context = {
		'pagetitle': pagetitle,
		'collectioninfo': collectioninfo,
		'collection': collection,
		'contributorset': contributorset,
		'labels1': labels1,
		'data1': data1,
		'labels2': labels2,
		'data2': data2,
		'labels3': labels3,
		'data3': data3,
		# 'labels4': labels4,
		# 'data4': data4,
		'region_dict': region_dict,
		'maplayer': maplayer,
		'labels5': labels5,
		'data5': data5,
		'form': form,
	}
		
	template = loader.get_template('digisig/info_collections.html')                   
	return HttpResponse(template.render(context, request))


############################## place #############################


def place_page(request, digisig_entity_number):

	starttime = time()

	place_object = get_object_or_404(Location, id_location=digisig_entity_number)
	pagetitle = place_object.location
	mapdic = mapgenerator(place_object, 0)

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/place.html')  

		displaystatus = 1

		#note that is should pick up cases where manifestations are associated with secondary places?
		manifestation_object = Manifestation.objects.filter(
				fk_support__fk_part__fk_event__locationreference__fk_locationname__fk_location__id_location=digisig_entity_number).distinct()

		if request.method == 'POST':
			form = PageCycleForm(request.POST)
			print ('form received')
			if form.is_valid():
				qpagination = form.cleaned_data['pagination']
				rows = len(manifestation_object)
				form = PageCycleForm(request.POST)
				displaystatus = 0

		else:
			form = PageCycleForm()
			qpagination = 1

		pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows, manifestation_object = paginatorJM(qpagination, manifestation_object)

		manifestation_set = manifestationmetadata(manifestation_object)

		context = {
			'pagetitle': pagetitle,
			'place_object': place_object,
			'mapdic': mapdic, 
			'manifestation_set': manifestation_set,
			'displaystatus': displaystatus,
			'totalrows': totalrows,
			'totaldisplay': totaldisplay,
			'form': form,
			'pagecountercurrent': pagecountercurrent,
			'pagecounternext': pagecounternext,
			'pagecounternextnext': pagecounternextnext,
			}

	else:
		authenticationstatus = "public"
		template = loader.get_template('digisig/place_simple.html')   

		context = {
			'pagetitle': pagetitle,
			'place_object': place_object,
			'mapdic': mapdic, 
			}

	print("Compute Time:", time()-starttime)

	return HttpResponse(template.render(context, request))


############################## part #############################


############################## actor #############################

def actor_page(request, digisig_entity_number):

	starttime = time()

	individual_object = get_object_or_404(Individual, id_individual=digisig_entity_number)
	pagetitle= namecompiler(individual_object)

	if request.user.is_authenticated:
		authenticationstatus = "authenticated"
		template = loader.get_template('digisig/actor.html')

		seal_objectset = Seal.objects.filter(
			Q(fk_individual_realizer=individual_object.id_individual) | Q(fk_actor_group=individual_object.id_individual)
		). order_by('fk_individual_office', 'fk_individual_realizer')

		sealnumber = len(seal_objectset)
		seal_object = []
		sealdescriptionset = []

		if (sealnumber > 0):
			for s in seal_objectset:
				current_id_seal = s.id_seal
				current_id_actor = s.fk_individual_realizer
				manifestation_instance = DigisigManifestationview.objects.filter(fk_seal = current_id_seal).order_by('id_representation')[:1]

				for c in manifestation_instance:
					representationid = c.id_representation
					if representationid is None:
						seal_object.append((s.id_seal, 'Null', 'Null', 'Null', 'Null', 'Null', s.fk_individual_realizer, s.datestart_seal, s.dateend_seal, s.fk_individual_office))
					else:
						seal_object.append((s.id_seal, c.thumb, c.representation_thumbnail, c.id_representation, c.medium, c.representation_filename, s.fk_individual_realizer, s.datestart_seal, s.dateend_seal, s.fk_individual_office))

				# this code prepares the list of descriptions associated to each seal

				sealdescription_object = Digisigsealdescriptionview.objects.filter(fk_seal=current_id_seal)
				for g in sealdescription_object:
					sealdescriptionset.append((current_id_seal, g.id_sealdescription, g.collection_shorttitle, g.sealdescription_identifier))   
					
		# list of relationships for each individual
		relationship_object = Digisigrelationshipview.objects.filter(fk_individual = digisig_entity_number)
		relationshipnumber = len(relationship_object)

		references_object = Referenceindividual.objects.filter(fk_individual= digisig_entity_number).order_by("fk_event_id__startdate", "fk_event_id__enddate")

		references_set = []

		for r in references_object:
			locationref = Locationreference.objects.get(fk_event=r.fk_event, fk_locationstatus=1)
			relatedparts = Part.objects.filter(fk_event=r.fk_event)
			for e in relatedparts:
				references_set.append([r, e, locationref])

		context = {
			'pagetitle': pagetitle,
			'individual_object': individual_object,
			'seal_object': seal_object,
			'sealnumber': sealnumber,
			'relationship_object': relationship_object,
			'relationshipnumber' : relationshipnumber,
			'sealdescriptionset': sealdescriptionset,
			'references_set': references_set,
			}

	else:
		authenticationstatus = "public"
		template = loader.get_template('digisig/actor_simple.html')

		context = {
			'pagetitle': pagetitle,
			'individual_object': individual_object,
			}

	print("Compute Time:", time()-starttime)
	return HttpResponse(template.render(context, request))

