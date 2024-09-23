## general tools
from digisig.models import * 
from django.shortcuts import get_object_or_404
from django.core import serializers
from datetime import datetime
# import urllib.request
import shutil
# from PIL import Image
# import statistics
# import math
# import json
# from rdflib import Graph, Literal, RDF, URIRef, Namespace
# from rdflib.namespace import FOAF, XSD

############# Table of Contents ############
# seriesset
# gettime
# getquantiles
# comparedatesup
# comparedatesdown
# representationmetadata
# manifestationmetadata
# itemsearch
# temporaldistribution
# faceupdater
# roundedoval
# representation_photographs
# deletesealfull {very dangerous}
# addseal


def seriesset():
	# code prepares the array of series and repositories to pass to the frontend
	# series_set = Series.objects.all()
	# series_object = []
	# for g in series_set:
	# 	series_object.append((g.pk_series, g.fk_repository))

	series_object = serializers.serialize('json', Series.objects.all(), fields=('pk_series','fk_repository'))

	return (series_object)

def gettime(start_time):
	end_time = datetime.now()
	difference = str((end_time - start_time).total_seconds())[:5]

	return (difference)

#### 
def challengeurl(request, searchtype, form):
	#sourceurl = request.META['REMOTE_ADDR']
	#sourceurl2 = request.headers['X-Forwarded-For']
	#print (sourceurl, request)

	user_ip = request.META.get('HTTP_X_FORWARDED_FOR')
	if user_ip:
		ip = user_ip.split(',')[0]
	else:
		ip = request.META.get('REMOTE_ADDR')

    #prepare a log entry for the requested changes
	newlog = Logsearch()
	newlog.request = request
	newlog.ip = ip
	newlog.searchform = searchtype
	newlog.searchphrase = form.cleaned_data
	newlog.searchtime = datetime.now()
	newlog.save()

	return(ip)

# def comparedatesup(date1, date1precision, date2, date2precision):
# 	# is date1 a better higher date?
# 	#if (date1 > date2):
# 	#if (date1precision <= date2precision):
	
# 	#Start by assuming that should accept 
# 	returndate = date1
# 	returnprecision = date1precision
	
# 	# if the precision in date1 is not as good then assume return date2
# 	if (date1precision > date2precision):
# 		returndate = date2
# 		returnprecision = date2precision

# 		#except if the precision of date1 is good and it improves the year sufficiently superior....
# 		if (date1precision < 11):
# 			# if date2 is greater than date1 by more than ten years then take date1....
# 			if ((date2 - date1) > 10):
# 				finaldate = date1
# 				finalprecision = date1precision	
# 				# print ("y3")
# 			# if the difference in date2 and date 1 is precision is 5 less than but improvemes the date more than five years accept 
# 			elif (date2 - date1 < 5):
# 				if ((finaldate - outdate) < 5):
# 					finaldate = outdate
# 					finalprecision = precision
# 					# print ("y4")
# 			returndate = finaldate
# 			returnprecision = finalprecision

# 		# if the difference in precision is 10 years or more decline 
# 		else:
# 			# print ("y5") 
# 			pass 

# 	return (returndate, returnprecision)

# def comparedatesdown(date1, date1precision, date2, date2precision):
# 	# is date 1 a better lower date?
# 	if (date1 < date2):
# 		if (date1precision <= date2precision):
# 			returndate = date1
# 			returnprecision = date1precision
# 			# print ("y2")	
# 		# if the precision is not as good
# 		if (date1precision > date2precision):
# 			# if the difference in precision is less than five years accept
# 			if ((precision - finalprecision) < 5):
# 				finaldate = outdate
# 				finalprecision = precision	
# 				# print ("y3")
# 			# if the difference in precision is 5 to 9 years but the improvement is more than five years accept 
# 			elif ((precision - finalprecision) < 10):
# 				if ((finaldate - outdate) < 5):
# 					finaldate = outdate
# 					finalprecision = precision
# 					# print ("y4")	
# 			# if the difference in precision is 10 years or more decline 
# 			else:
# 				# print ("y5") 
# 				pass 

# 	return (returndate, returnprecision)

def createlogentry(request, form, entityedit):

	#prepare a log entry for the requested changes
	newlog = Logdigisigedit()
	newlog.fk_userdigisig = request.user.id
	newlog.action_time = datetime.now()
	newlog.action_entityedit = entityedit
	newlog.action_editrequest = form.cleaned_data
	newlog.save()

	return(newlog)

def geteventitem(event1):
	eventset = []

	for e in event1:
		relatedparts = Part.objects.filter(fk_event=e.pk_event)
	for r in relatedparts:
		eventset.append([e.pk_event, e.startdate, e.enddate, r.pk_part, r.fk_item.id_item, r.reference_full])

	return (eventset)

def getquantiles(timegroupcases):

	timelist = []
	for t in timegroupcases:

		try:
			timelist.append(int(t.date_origin))

		except:
			print ("exception", t)

	quantileset = statistics.quantiles(timelist, n=6)

	print ("timelist", timelist)
	print ("quantileset", quantileset)

	resultrange = "c." + str(int(quantileset[0])) + "-" + str(int(quantileset[4]))

	return (resultrange)

# handle range dates -- if range, then determine midpoint and precision
def datetester(date1, date2):
	returndate = 0
	returnprecision = 0
	#this is a hack -- must be a better way to test if value is datetime.

	print (date1, date2)
	if str(type(date1)) == "<class 'datetime.date'>":
		date1 = date1.year
	if date1 > 0:
		returndate = date1
		returnprecision = 0
		if(date2 is not None):
			if str(type(date2)) == "<class 'datetime.date'>":
				date2 = date2.year
			if date2 > date1:
				returndate = int((date1 + date2)/2)
				returnprecision = int((date2-date1)/2)

	return(returndate, returnprecision)

## function to assemble a group of representations from a list of seals (builds off of def representationmetadata)
def representationlist(sealset):

	representationlist = []

	for s in sealset:

		print ("try")

		try:
			targetrepresentation = get_object_or_404(Representation, fk_manifestation__fk_face__fk_seal=s.id_seal, primacy=1, fk_representation_type=1)
			# #assemble the data for links and metadata for images of examples:
			representationinfo = representationmetadata(targetrepresentation)
			representationlist.append(representationinfo)

		except:
			print ("could not find representation for:", s)

	return (representationlist)




# information for presenting a seal manifestation
def manifestationmetadata(manifestation_object):

	manifestation_set = {}

	for e in manifestation_object:
		manifestation_dic = {}
		facevalue = e.fk_face
		sealvalue = facevalue.fk_seal
		supportvalue = e.fk_support
		numbervalue = supportvalue.fk_number_currentposition
		partvalue = supportvalue.fk_part
		eventvalue = partvalue.fk_event
		itemvalue = partvalue.fk_item
		repositoryvalue = itemvalue.fk_repository
		representation_set = Representation.objects.filter(fk_manifestation=e.id_manifestation).filter(primacy=1)[:1]

		if representation_set.count() == 0:
			print ("no image available for:", e.id_manifestation)
			representation_set = Representation.objects.filter(id_representation=12204474)

		sealdescription_set = Sealdescription.objects.filter(fk_seal=facevalue.fk_seal)
		locationreference_set = Locationreference.objects.filter(fk_event=eventvalue.pk_event).filter(fk_locationstatus=1)[:1]

		manifestation_dic["manifestation"] = e
		manifestation_dic["id_manifestation"] = e.id_manifestation
		manifestation_dic["fk_position"] = e.fk_position

		manifestation_dic["id_seal"] = sealvalue.id_seal
		manifestation_dic["id_item"] = itemvalue.id_item
		manifestation_dic["repository_fulltitle"] = repositoryvalue.repository_fulltitle
		manifestation_dic["shelfmark"] = itemvalue.shelfmark
		manifestation_dic["fk_supportstatus"] = supportvalue.fk_supportstatus
		manifestation_dic["fk_attachment"] = supportvalue.fk_attachment		
		manifestation_dic["number"] = numbervalue.number
		manifestation_dic["support_type"] = supportvalue.fk_nature
		manifestation_dic["label_manifestation_repository"] = e.label_manifestation_repository
		manifestation_dic["imagestate_term"] = e.fk_imagestate
		manifestation_dic["partvalue"] = partvalue.id_part

		#take the repository submitted date in preference to the Digisig date
		if eventvalue.repository_startdate:
			manifestation_dic["repository_startdate"] = eventvalue.repository_startdate
		else:
			manifestation_dic["repository_startdate"] = eventvalue.startdate 

		if eventvalue.repository_enddate:
			manifestation_dic["repository_enddate"] = eventvalue.repository_enddate
		else:
			manifestation_dic["repository_enddate"] = eventvalue.enddate

		for l in locationreference_set:
			locationname= l.fk_locationname
			location = locationname.fk_location
			manifestation_dic["repository_location"] = location.location
			manifestation_dic["id_location"] = location.id_location

		for r in representation_set:
			connection = r.fk_connection
			manifestation_dic["thumb"] = connection.thumb
			manifestation_dic["medium"] = connection.medium
			manifestation_dic["representation_thumbnail_hash"] = r.representation_thumbnail_hash
			manifestation_dic["representation_filename_hash"] = r.representation_filename_hash 
			manifestation_dic["representation_thumbnail"] = r.representation_thumbnail
			manifestation_dic["representation_filename"] = r.representation_filename
			manifestation_dic["id_representation"] = r.id_representation

		manifestation_dic["sealdescriptions"] = sealdescription_set

		manifestation_set[e.id_manifestation] = manifestation_dic

	return (manifestation_set)

def representation_photographs(representation_select):

	representationset = {}
	
	for t in representation_select:
		#Holder for representation info
		representation_dic = {}

		#blank the descriptions
		sealdescriptions_dic = {}

		#for all images
		connection = t.fk_connection
		representation_dic["connection"] = connection
		representation_dic["connection_thumb"] = connection.thumb
		representation_dic["connection_medium"] = connection.medium
		representation_dic["representation_filename"] = t.representation_filename_hash
		representation_dic["representation_thumbnail"] = t.representation_thumbnail_hash
		representation_dic["id_representation"] = t.id_representation 
		representation_dic["fk_digisig"] = t.fk_digisig
		representation_dic["manifestation"] = t.fk_manifestation

		#case it is an impression or matrix
		try:
			print ("impression/matrix")
			manifestation = Manifestation.objects.get(id_manifestation=t.fk_manifestation)
			face = manifestation.fk_face
			seal = face.fk_seal 
			support = manifestation.fk_support 
			part = support.fk_part
			
			sealdescriptionset = Sealdescription.objects.filter(fk_seal=seal.id_seal)
			for sd in sealdescriptionset:
				descriptions = {}
				descriptions["collection"] = str(sd.fk_collection)
				descriptions["identifier"] = sd.sealdescription_identifier
				sealdescriptions_dic[sd.id_sealdescription] = descriptions

			representation_dic["date_origin"] = str(seal.date_origin)
			representation_dic["fk_shape"] = str(face.fk_shape)
			representation_dic["fk_class"] = str(face.fk_class)
			representation_dic["number"] = str(support.fk_number_currentposition)
			representation_dic["position"] = manifestation.fk_position
			representation_dic["supportstatus"] = support.fk_supportstatus
			representation_dic["attachment"] = support.fk_attachment
			representation_dic["supporttype"] = support.fk_nature
			representation_dic["label_manifestation_repository"] = manifestation.label_manifestation_repository
			representation_dic["fk_seal"] = seal.id_seal
			representation_dic["id_manifestation"] = manifestation.id_manifestation
			representation_dic["imagestate_term"] = str(manifestation.fk_imagestate)
			representation_dic["descriptions"] = descriptions
			
		except:
			#case it is a document or object
			try:
				print ("document")
				part = Part.objects.get(id_part=t.fk_digisig)
				item = part.fk_item 
				repository = item.fk_repository 
				event = part.fk_event

			#case not sure
			except:
				print ("error in identifying representation metadata")

		item = part.fk_item 
		repository = item.fk_repository
		event = part.fk_event

		representation_dic["repository_fulltitle"] = repository.repository_fulltitle
		representation_dic["shelfmark"] = item.shelfmark
		representation_dic["fk_item"] = item.id_item
		representation_dic["repository_location"] = event.repository_location
		representation_dic["repository_startdate"] = event.repository_startdate
		representation_dic["repository_enddate"] = event.repository_enddate

		representationset[t.id_representation] = representation_dic

	return (representationset)


def itemsearch(repository, series, shelfmark, searchphrase, pagination):

	itemset = {}
	Repositorycases = 0
	Seriescases = 0
	Shelfmarkcases = 0
	Phrasecases = 0

	item_object = Item.objects.all().order_by("fk_repository", "fk_series", "classmark_number3", "classmark_number2", "classmark_number1")


	# take the series in preference to the repository

	if series > 0:
		item_object = item_object.filter(fk_series=series)
		Seriescases = len(item_object)

	elif repository > 0:
		item_object = item_object.filter(fk_repository=repository)
		Repositorycases = len(item_object)

	else:
		print ("No repository or series specified")

	if len(shelfmark) > 0:
		item_object = item_object.filter(shelfmark__icontains=shelfmark)
		Shelfmarkcases = len(item_object)

	if len(searchphrase) > 0:
		item_object = item_object.filter(part__part_description__icontains=searchphrase)
		Phrasecases = len(item_object)

	pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows, item_object = paginatorJM(pagination, item_object)

	for i in item_object:
		item_dic = {}
		item_dic["id_item"] = i.id_item
		item_dic["shelfmark"] = i.shelfmark
		item_dic["repository"] = i.fk_repository.repository_fulltitle

		try:
			partset = Part.objects.filter(fk_item=i.id_item).values("id_part")
			representation_part = Representation.objects.filter(fk_digisig__in=partset)[:1]

			for r in representation_part:
				connection = r.fk_connection
				item_dic["connection"] = connection.thumb
				item_dic["medium"] = r.representation_filename
				item_dic["thumb"] = r.representation_thumbnail_hash
				item_dic["id_representation"] = r.id_representation 

		except:
			print("No image available")

		itemset[i.id_item] = item_dic

	return (itemset, Repositorycases, Seriescases, Shelfmarkcases, Phrasecases, pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, totalrows)


def temporaldistribution(timegroupcases):
	#prepare the temporal groups of seals for graph
	timegroupset = TimegroupC.objects.filter(pk_timegroup_c__lt=15).order_by('pk_timegroup_c')
	timecount = {}

	# set the number in each group to 0
	for t in timegroupset:
		timecount.update({t.timegroup_c_range: 0})

	# how many seals belong in each temporal group?
	for case in timegroupcases:

		origindate = case.date_origin
		if origindate < 1500 and origindate > 999:
			targettimegroup = case.fk_timegroupc

			if targettimegroup.pk_timegroup_c <15:
				#number of cases for each time period
				timegroupupdate = targettimegroup.timegroup_c_range
				timecount[timegroupupdate] += 1

	#
	labels = []
	data = []

	# determine how many seals should go in each temporal group
	for key, value in timecount.items():
		labels.append(key)
		data.append(value)

	return (labels, data)


def faceupdater(shapecode, height, width):

	print (shapecode, height, width)
	returnarea = 0

	if height == None:
		return(returnarea)

	if width == None:
		return(returnarea)

	if height > 0:
		if width > 0:
			#round
			if shapecode == 1:
				radius1 = height/2
				returnarea = math.pi * (radius1 **2)

			# Pointed Oval
			if shapecode == 2:
				radius1 = ((height * 1.06)/ 2)
				width1 = width/2
				returnarea = (((radius1**2) * (math.acos((radius1-width1) / radius1)))-((radius1-width1) * (math.sqrt((2*radius1*width1)-(width1**2))))) *2

			# Rounded Oval
			if shapecode == 3:
				returnarea = roundedoval(height, width)

			# Scutiform
			if shapecode == 4:
				returnarea = ((height/2) * width) + ((height/2) * (width/2))

			# Unknown
			if shapecode == 5:
				returnarea = roundedoval(height, width)

			# Triangle pointing up
			if shapecode == 6:
				returnarea = (height * (width/2))

			# Square
			if shapecode == 7:
				returnarea = (height * width)

			# Lozenge-shaped
			if shapecode == 8:
				returnarea = (height * width)/2

			# Quatrofoil
			if shapecode == 9:
				heightvalue = height/2
				returnarea = ((heightvalue**2) + 2 * ((math.pi * (heightvalue**2) /4)))

			# Drop-shaped
			if shapecode == 10:
				returnarea = roundedoval(height, width)

			# Undetermined
			if shapecode == 11:
				returnarea = 0

			# Triangle pointing down
			if shapecode == 12:
				returnarea = (height * (width/2))

			# Rectangular
			if shapecode == 13:
				returnarea = (height * width)

			# Hexagonal
			if shapecode == 14:
				## note that hexagons might measured from either the angle or a flat side
				## run calculation with the smallest dimension -- not the angles. https://www.math.net/area-of-a-hexagon
				testdimension = width
				if height < width:
					testdimension = height
				returnarea = (math.sqrt(3)/2) * (testdimension**2)

			# Octagonal
			if shapecode == 15:
				returnarea = 2*((height/(1+math.sqrt(2)))**2)*(1+math.sqrt(2))

			# Abnormal shape
			if shapecode == 16:
				returnarea = roundedoval(height, width)

			# Kite-shaped
			if shapecode == 17:
				returnarea = roundedoval(height, width)

	returnarea = round(returnarea,2)
	
	return(returnarea)

def roundedoval(height, width):
	radius1 = height/2
	width1 = width/2
	returnarea = math.pi * radius1 * width1	

	return(returnarea)


def deletesealfull(sealinput):

	#This code is designed to get rid of every object linked to a seal -- use with caution!
	sealtarget = sealinput
	sealdescriptiontarget = Sealdescription.objects.filter(fk_seal=sealtarget)
	facetarget = Face.objects.filter(fk_seal=sealtarget)

	for sd in sealdescriptiontarget:
		sealdescriptionexternalreference = Externallink.objects.filter(internal_entity=sd.id_sealdescription)

		for sr in sealdescriptionexternalreference:
			print (sr)
			sr.delete()

	for f in facetarget:
		manifestationtarget = Manifestation.objects.filter(fk_face=f)

		for m in manifestationtarget:

			representationtarget = Representation.objects.filter(fk_manifestation=m)
			supporttarget = m.fk_support
			parttarget = supporttarget.fk_part
			itemtarget = parttarget.fk_item
			eventtarget = parttarget.fk_event
			locationreferencetarget = Locationreference.objects.filter(fk_event=eventtarget)

			itemexternalreference = Externallink.objects.filter(internal_entity=itemtarget.id_item)
			for ir in itemexternalreference:
				print (ir)
				ir.delete()

			for l in locationreferencetarget:
				print (l)
				l.delete()

			for r in representationtarget:
				print (r)
				r.delete()

			print (manifestationtarget, eventtarget, itemtarget, parttarget, supporttarget)
			eventtarget.delete()
			itemtarget.delete()
			parttarget.delete()
			supporttarget.delete()
			manifestationtarget.delete()

		print (f)
		f.delete()

	print (sealtarget, sealdescriptiontarget)
	sealtarget.delete()
	sealdescriptiontarget.delete()

	return("Deletion Operation")


def addseal(seal_object, sealdescription_object2, manifestation_object): 
	
	### code assumes that you are working on a doubleside matrix and want to add an entry for the second side
	print ("####ADD SEAL ####")

	ns = Seal()
	ns.pas_temp = seal_object.pas_temp
	ns.fk_individual_realizer = seal_object.fk_individual_realizer
	ns.save()
	print ("new seal", ns.pk)

	nf = Face()
	nf.fk_seal = Seal.objects.get(id_seal = ns.pk)
	nf.fk_faceterm = Faceterm.objects.get(pk_faceterm=1)
	nf.save()
	print ("new face", nf.pk)

	nm = Manifestation()
	nm.fk_support = manifestation_object.fk_support
	nm.fk_position = Position.objects.get(pk_position=2)
	nm.ui_manifestation_repository = manifestation_object.ui_manifestation_repository
	nm.fk_image_state = ImageState.objects.get(pk_imagestate=2)
	nm.fk_face = Face.objects.get(id_face = nf.pk)
	nm.save()
	print ("new manifestation", nm.pk)

	manifestation_object.fk_position = Position.objects.get(pk_position=1)
	manifestation_object.save()

	seal_descriptionrevise = Sealdescription.objects.filter(fk_collection = sealdescription_object2.fk_collection).filter(catalogue_orderingnumber__gt=sealdescription_object2.catalogue_orderingnumber).order_by('catalogue_orderingnumber')

	for sdrevise in seal_descriptionrevise:
		# print (sdrevise.catalogue_orderingnumber)
		newnumber = sdrevise.catalogue_orderingnumber +1
		sdrevise.catalogue_orderingnumber = newnumber
		# print ('rev ',newnumber, sdrevise.id_sealdescription)
		sdrevise.save()

	sd = Sealdescription()
	sd.sealdescription = sealdescription_object2.sealdescription
	sd.sealdescription_identifier = sealdescription_object2.sealdescription_identifier
	sd.fk_collection = sealdescription_object2.fk_collection
	targetnumber = sd.catalogue_orderingnumber
	sd.catalogue_orderingnumber = sealdescription_object2.catalogue_orderingnumber + 1
	sd.fk_contributor = sealdescription_object2.fk_contributor
	sd.fk_connection = sealdescription_object2.fk_connection
	sd.ui_catalogue = sealdescription_object2.ui_catalogue
	sd.catalogue_date = sealdescription_object2.catalogue_date
	sd.catalogue_size = sealdescription_object2.catalogue_size
	sd.location = sealdescription_object2.location
	sd.fk_seal = Seal.objects.get(id_seal = ns.pk)
	sd.save()
	print ("new sealdescription", sd.pk)

	ex = Externallink()
	ex.internal_entity = sd.id_sealdescription
	ex.link_predicate = "http://www.w3.org/2002/07/owl#sameAs"
	ex.external_link = "https://finds.org.uk/database/artefacts/record/id/" + str(sd.ui_catalogue)	
	ex.save()
	print ("external link added")

	return("Seal added")


def revisesealdescription(sealdescription_object2, face_object, form):
	print ("#### Revise ####")


	### revision to sealdescription title
	if len(form.cleaned_data['sealdescriptiontitle']) > 0:
		print ("revise title")
		sealdescription_object2.sealdescription_title = form.cleaned_data['sealdescriptiontitle']
		sealdescription_object2.save()
	if len(form.cleaned_data['motif_obverse']) > 0:
		print ("revise motif")
		sealdescription_object2.motif_obverse = form.cleaned_data['motif_obverse']
		sealdescription_object2.save()
	if len(form.cleaned_data['legend_obverse']) > 0:
		print ("legend_obverse")
		sealdescription_object2.legend_obverse = form.cleaned_data['legend_obverse']
		sealdescription_object2.save()

	for f in face_object:
		if len(form.cleaned_data['shape']) > 0:
			print ("shape")
			f.fk_shape = Shape.objects.get(pk_shape = form.cleaned_data['shape'])
			f.save()
		if len(form.cleaned_data['classname']) > 0:
			print ("classname")
			#for some reason in the dbs postgres the table is class, but in the model it is classification.... inconsistency to fix at some point
			f.fk_class = Classification.objects.get(id_class = form.cleaned_data['classname'])
			f.save()
		if (form.cleaned_data['face_vertical']) !=None:	
			if form.cleaned_data['face_vertical'] > 0:
				print ("face_vertical")
				f.face_vertical = form.cleaned_data['face_vertical']
				f.save()
		if (form.cleaned_data['face_horizontal']) !=None:	
			if form.cleaned_data['face_horizontal'] > 0:
				print ("face_horizontal")
				f.face_horizontal = form.cleaned_data['face_horizontal']
				f.save()

	return("Update Operation")


def addimageformanifestation(manifestationvalue, image_url, imagesuffix):

### takes in an image url and manifestation value and adds it -- 2023 may
### assumes you are adding it to a PAS entry and the new one will take primacy-- will need  to generalize
### called from PAS edit2
	
	print ("####ADD IMAGE ####")

	existingimagecount = Representation.objects.filter(fk_digisig=manifestationvalue).count()
	print("existing image count", existingimagecount)

	if (existingimagecount > 0):
		representation_set = Representation.objects.filter(fk_digisig=manifestationvalue)
		#ensure that other images are not primary
		for r in representation_set:
			print(r)
			r.primacy = False 
			r.save()

	#prepare the new representation (based on PAS defaults)
	i = Representation()
	i.fk_digisig = manifestationvalue
	i.fk_manifestation = get_object_or_404(Manifestation, id_manifestation=manifestationvalue)
	i.representation_date = datetime.now()
	i.fk_contributor = get_object_or_404(Contributor, pk_contributor=1)
	i.fk_access = get_object_or_404(Access, pk_access=1)
	i.fk_collection_old = 17
	i.fk_collection = get_object_or_404(Collection, id_collection=30000047)
	i.fk_contributor_creator = get_object_or_404(Contributor, pk_contributor=11)
	i.fk_connection = get_object_or_404(Connection.objects, pk_connection=28)
	i.primacy = True
	i.fk_representation_type = get_object_or_404(RepresentationType, pk_representation_type=1)
	i.original_representation_filename = image_url
	i.fk_connection_alternate = 1
	i.save()

	#find out what id it got
	print ("new representation", i.pk)
	newimage = str(i.pk)
	print (newimage)

	imagesaveroot1 = "D:/Archive/1x_photorepository_original/"
	imagesaveroot2 = "D:/Archive/1x_photorepository_original/original/"
	imagesaveroot3 = "D:/Archive/1photorepository/medium/"
	imagesaveroot4 = "D:/Archive/1photorepository/small/"
	imagesaveroot5 = "D:/Archive/1z_photorepository_working/backblazeupload/medium/"
	imagesaveroot6 = "D:/Archive/1z_photorepository_working/backblazeupload/small/"

	fullfilename = newimage + "_" + imagesuffix + ".jpg"

	i.representation_thumbnail= fullfilename
	i.representation_filename = fullfilename

	i.save()
	print (i)

	image_out = imagesaveroot1 + fullfilename

	#test to see if a local file or url
	locationfile = image_url.find("http")

	if locationfile > 0:
		inputimage = urllib.request.urlretrieve(image_url, image_out)
	else: inputimage = urllib.request.pathname2url(image_url)

	#temp -- for testing
	# imagename = "12093014_10166.jpg"

	im = Image.open(image_out)

	widthimage, heightimage = im.size
	i.width = widthimage
	i.height = heightimage
	i.save()

	image_out = imagesaveroot2 + fullfilename
	im.save(image_out, "JPEG")

	sizethumb = (500,500)
	im.thumbnail(sizethumb)

	##the medium
	image_out = imagesaveroot3 + fullfilename
	im.save(image_out, "JPEG")
	image_out = imagesaveroot5 + fullfilename
	im.save(image_out, "JPEG")


	sizethumb = (200,200)
	im.thumbnail(sizethumb)

	##the thumbnails
	image_out = imagesaveroot4 + fullfilename
	im.save(image_out, "JPEG")
	image_out = imagesaveroot6 + fullfilename
	im.save(image_out, "JPEG")

	return("Update Operation")



############################# functions ##############################

### calculate the percentage
def calpercent(total, portion):
	output = (portion/total) * 100
	return (output)


def classfilter(resultset, classname):
	class_object = Classification.objects.get(id_class=classname)
	resultset = resultset.filter(fk_class__level1=class_object.level1)

	if class_object.level2 > 0:
		resultset = resultset.filter(fk_class__level2=class_object.level2)
		if class_object.level3 > 0:
			resultset = resultset.filter(fk_class__level3=class_object.level3)
			if class_object.level4 > 0:
				resultset = resultset.filter(fk_class__level4=class_object.level4)
				if class_object.level5 > 0:
					resultset = resultset.filter(fk_class__level5=class_object.level5)
					if class_object.level6 > 0:
						resultset = resultset.filter(fk_class__level6=class_object.level6)
						if class_object.level7 > 0:
							resultset = resultset.filter(fk_class__level7=class_object.level7)
	return(resultset)





def classdistributionv2(face_objectset):

	facecount = face_objectset.count()

	data2 = []
	labels2 = []
	resultdic = {}

	classset = Classification.objects.all().order_by("-level")

	classsetdic = {}
	
	for c in classset:
		Countfacesclass = face_objectset.filter(fk_class=c.id_class).count()
		classsetdic[c.id_class]= Countfacesclass

	for i in classset:
		#print (i)
		countfacestarget = 0

		if (i.level == 4):
			limitset = classset.filter(level4=i.class_number)
			for l in limitset:
				countfacestarget = countfacestarget + classsetdic.get(l.id_class)
		if (i.level == 3):
			limitset = classset.filter(level3=i.class_number)
			for l in limitset:
				countfacestarget = countfacestarget + classsetdic.get(l.id_class)
		if (i.level == 2):
			limitset = classset.filter(level2=i.class_number)
			for l in limitset:
				countfacestarget = countfacestarget + classsetdic.get(l.id_class)
		if (i.level == 1):
			limitset = classset.filter(level1=i.class_number)
			for l in limitset:
				countfacestarget = countfacestarget + classsetdic.get(l.id_class)

		percentagedata = (countfacestarget/facecount)*100
		if percentagedata > 1:
			resultdic.update({i.class_name: percentagedata})

	classset = classset.order_by('class_sortorder')
	for case in classset:
		if case.class_name in resultdic:
			classpercentage = resultdic.get(case.class_name)
			if classpercentage > 1:
				data2.append(classpercentage)
				labels2.append(case.class_name)

	return(data2, labels2)


def collectiondata(collectionid, sealcount):
	collectiondatapackage = []
	if collectionid == 30000287:
		totalsealdescriptions = Sealdescription.objects.all().count()
	else:
		totalsealdescriptions = Sealdescription.objects.filter(fk_collection=collectionid).values().distinct('sealdescription_identifier').count()

	collectiondatapackage.extend([totalsealdescriptions, sealcount])

	return(collectiondatapackage)




# ### generate the collection info data for chart-- 'Percentage of seals by class',
# def datedistribution(sealset):

# 	# eleventhc = sealset.filter(date_origin__gte=1000, date_origin__lte=1099).count()
# 	# twelfthc = sealset.filter(date_origin__gte=1100, date_origin__lte=1199).count()
# 	# thirteenthc = sealset.filter(date_origin__gte=1200, date_origin__lte=1299).count()
# 	# fourteenthc = sealset.filter(date_origin__gte=1300, date_origin__lte=1399).count()
# 	# fifteenthc = sealset.filter(date_origin__gte=1400, date_origin__lte=1499).count()
# 	# sixteenthc = sealset.filter(date_origin__gte=1500, date_origin__lte=1599).count()
# 	# seventeenthc = sealset.filter(date_origin__gte=1600, date_origin__lte=1699).count()
# 	# eighteenthc = sealset.filter(date_origin__gte=1700, date_origin__lte=1799).count()
# 	# ninteenthc = sealset.filter(date_origin__gte=1800, date_origin__lte=1899).count()
# 	# twentiethc = sealset.filter(date_origin__gte=1900, date_origin__lte=1999).count()

# 	# data3 = [eleventhc, twelfthc, thirteenthc, fourteenthc, fifteenthc, sixteenthc, seventeenthc, eighteenthc, ninteenthc, twentiethc]
# 	# labels3 = ["11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th"]

# 	## rewrite of algorithm 1/3/2024, below 

# 	eleventhc = 0
# 	twelfthc = 0
# 	thirteenthc = 0
# 	fourteenthc = 0
# 	fifteenthc = 0
# 	sixteenthc = 0
# 	seventeenthc = 0
# 	eighteenthc = 0
# 	nineteenthc = 0
# 	twentiethc = 0

# 	for s in sealset:
# 		if s.date_origin >= 1000 and s.date_origin <= 1099 : 
# 			eleventhc = eleventhc + 1
# 		elif s.date_origin >= 1100 and s.date_origin <= 1199 : 
# 			twelfthc = twelfthc + 1
# 		elif s.date_origin >= 1200 and s.date_origin <= 1299 : 
# 			thirteenthc = thirteenthc + 1
# 		elif s.date_origin >= 1300 and s.date_origin <= 1399 : 
# 			fourteenthc = fourteenthc + 1
# 		elif s.date_origin >= 1400 and s.date_origin <= 1499 : 
# 			fifteenthc = fifteenthc + 1
# 		elif s.date_origin >= 1500 and s.date_origin <= 1599 : 
# 			sixteenthc = sixteenthc + 1
# 		elif s.date_origin >= 1600 and s.date_origin <= 1699 : 
# 			seventeenthc = seventeenthc + 1
# 		elif s.date_origin >= 1700 and s.date_origin <= 1799 : 
# 			eighteenthc = eighteenthc + 1
# 		elif s.date_origin >= 1800 and s.date_origin <= 1899 : 
# 			nineteenthc = nineteenthc + 1
# 		elif s.date_origin >= 1900 and s.date_origin <= 1999 : 
# 			twentiethc = twentiethc + 1

# 		else:
# 			pass

# 	data3 = [eleventhc, twelfthc, thirteenthc, fourteenthc, fifteenthc, sixteenthc, seventeenthc, eighteenthc, nineteenthc, twentiethc]
# 	labels3 = ["11th", "12th", "13th", "14th", "15th", "16th", "17th", "18th", "19th", "20th"]

# 	return(data3, labels3)


#gets example for classification display
def examplefinder(idterm):
	examplesetouta = ""
	examplesetoutb = ""
	examplesetout = {}

	example1 = Terminologyexample.objects.filter(fk_terminology=idterm)
	for e in example1:
		representationobject= e.fk_representation
		key = representationobject.id_representation
		root = representationobject.fk_connection

		examplesetouta=root.thumb + representationobject.representation_thumbnail_hash
		examplesetoutb=root.medium + representationobject.representation_filename_hash

		examplesetout[key] = {"small": examplesetouta, "medium": examplesetoutb}

	return (examplesetout)


# def eventset_data(itemnumber):
# 	part_object = Part.objects.filter(fk_item = itemnumber)
		
# 	event_set = []
# 	for p in part_object:
# 		year1= None
# 		year2= None
# 		year3= None
# 		year4= None
# 		location_dig = None
# 		location_id = None
# 		location_longitude = None
# 		location_latitude = None

# 		#Establishing the Map data
# 		longitude=""
# 		latitude=""
# 		location=""
# 		location_dict = {}

# 		if p.fk_event.repository_startdate is not None: 
# 			yeartemp = p.fk_event.repository_startdate
# 			year1 = yeartemp.year
# 			if p.fk_event.repository_enddate is not None: 
# 				yeartemp = p.fk_event.repository_enddate
# 				year2 = yeartemp.year

# 		if p.fk_event.startdate is not None:
# 			yeartemp = p.fk_event.startdate
# 			year3 = yeartemp.year
# 			if p.fk_event.enddate is not None: 
# 				yeartemp = p.fk_event.enddate
# 				year4 = yeartemp.year

# 		if p.fk_event is not None:
# 			targetlocation = p.fk_event.pk_event
# 			# location_object = LocationReference.objects.filter(fk_event=targetlocation)
# 			#location_object = Locationname.objects.filter(locationreference__fk_event=targetlocation)
# 			location_object = Location.objects.filter(locationname__locationreference__fk_event=targetlocation, locationname__locationreference__location_reference_primary = False)

# 			for l in location_object:
# 				location_dig = l.location
# 				location_id = l.id_location
# 				location_longitude = str(l.longitude)
# 				location_latitude = str(l.latitude)

# 		location= {"type": "Point", "coordinates":[location_longitude, location_latitude]}
# 		location_dict = {'location': location_dig, 'latitude': location_latitude, 'longitude': location_longitude} 

# 		reference_dict = {}

# 		referenceset = Referenceindividual.objects.filter(fk_event=p.fk_event).order_by("fk_referencerole__role_order", "pk_referenceindividual")

# 		event_set.append((year1, year2, p.fk_event.repository_location, year3, year4, location_dig, location_id, location_longitude, location_latitude, referenceset, p))

# 		#print (event_set)

# 	return(location, location_dict, event_set)

def itemeditor(iID, form):
	## features of item

	if form.cleaned_data['repositories'] is not None:
		try:
			repositoryID = int(form.cleaned_data['repositories'])
			iID.fk_repository = get_object_or_404(Repository.objects, pk_repository=repositoryID)
		except:
			print ("no repository")

	if form.cleaned_data['series_all'] is not None:
		try:
			supportID = int(form.cleaned_data['series_all'])
			iID.fk_series = get_object_or_404(Series.objects, pk_series=supportID)
		except:
			print ("no series")

	return (iID)


def parteditor(pID, form):
	# features of part

	if form.cleaned_data['number_support'] is not None:
		try:
			numberID = int(form.cleaned_data['number_support'])
			s = Support()

			s.fk_item = pID.fk_item
			s.fk_part = pID.id_part
			s.fk_number_currentposition = get_object_or_404(number, pk_number=numberID)
			s.save()

		except:
			print ("no numberspecified")

	return (s)

def manifestationeditor(manifestation_object, form):

	## features of manifestation
	if form.cleaned_data['position'] is not None:
		try:
			positionID = int(form.cleaned_data['position'])
			manifestation_object.fk_position = get_object_or_404(Position.objects, pk_position=positionID)
		except:
			print ("no position")

	if form.cleaned_data['support'] is not None:
		try:
			supportID = int(form.cleaned_data['support'])
			manifestation_object.fk_support = get_object_or_404(Support.objects, id_support=supportID)
		except:
			print ("no support")

	return (manifestation_object)


def supporteditor(sID, form):
	if form.cleaned_data['material'] is not None:
		try:
			materialID = form.cleaned_data['material']
			sID.fk_material = get_object_or_404(Material, pk_material=materialID)
		except:
			print ("no material")

	if form.cleaned_data['attachment'] is not None:
		try:
			attachmentID = int(form.cleaned_data['attachment'])
			sID.fk_attachment = get_object_or_404(Attachment, pk_attachment=attachmentID)
		except:
			print ("no attachment")

	if form.cleaned_data['supportstatus'] is not None:
		try:
			supportstatusID = int(form.cleaned_data['supportstatus'])
			sID.fk_supportstatus = get_object_or_404(Supportstatus, id_supportstatus=supportstatusID)
		except:
			print ("no supportstatus")

	return (sID)

def faceeditor(fID, form):

	if form.cleaned_data['shape'] is not None:
		try:
			shapeID = int(form.cleaned_data['shape'])
			fID = get_object_or_404(Shape, pk_shape=shapeID)
		except:
			print ("no shape")

	if form.cleaned_data['dimensionsvert'] is not None:
		try:
			if form.cleaned_data['dimensionsvert'] > 0:
				fID.face_vertical = int(form.cleaned_data['dimensionsvert'])
		except:
			print ("no vertical")
		
	if form.cleaned_data['dimensionshoriz'] is not None:
		try:
			if form.cleaned_data['dimensionshoriz'] > 0:
				fID.face_horizontal = int(form.cleaned_data['dimensionshoriz'])
		except:
			print ("no horizontal")

	if form.cleaned_data['classname'] is not None:
		try:
			if form.cleaned_data['classname'] > 0:
				classnameID = int(form.cleaned_data['classname'])
				fID.fk_class = get_object_or_404(Classification, id_class=classnameID)
		except:
			print ("no class")

	return (fID)


def mapgenerator(location_object, count_in):
	#Establishing the Map data
	longitude=""
	latitude=""
	location=""
	location_dict = ""
	additionalformat = ""

	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	placelist = []

	value1 = location_object.id_location
	value2 = location_object.location
	value3 = count_in
	value4 = location_object.longitude
	value5 = location_object.latitude

	popupcontent = '<a href="entity/' + str(value1) + '">' + str(value2) + '</a>'

	if count_in > 0:
		popupcontent = popupcontent + ' ' + str(value3)

	properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
	geometry = {"type": "Point", "coordinates": [value4, value5]}
	location = {"type": "Feature", "properties": properties, "geometry": geometry}
	placelist.append(location)

	mapdic["features"] = placelist

	return(mapdic)


def mapgenerator2(location_object):
	center_lat = []
	center_long = []

	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	placelist = []
	lat_values = []
	long_values = []

	for loc in location_object:
		value1 = loc.id_location
		value2 = loc.location
		value3 = loc.count
		value4 = loc.longitude
		value5 = loc.latitude

		if type(loc.longitude) == int or type(loc.longitude) == float:
			lat_values.append(loc.latitude)
		if type(loc.latitude) == int or type(loc.latitude) == float:
			long_values.append(loc.longitude)

		popupcontent = '<a href="entity/' + str(value1) + '">' + str(value2) + '</a>'

		if value3 > 0:
			popupcontent = popupcontent + ' ' + str(value3)

		properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
		geometry = {"type": "Point", "coordinates": [value4, value5]}
		location = {"type": "Feature", "properties": properties, "geometry": geometry}
		placelist.append(location)

	mapdic["features"] = placelist

	center_long = statistics.median(long_values)
	center_lat = statistics.median(lat_values)

	return(mapdic, center_long, center_lat)

def mapgenerator3(regiondisplayset):
	## data for region map
	# make circles data -- defaults -- note that this code is very similar to the function mapdata2
	mapdic = {"type": "FeatureCollection"}
	properties = {}
	geometry = {}
	location = {}
	regionlist = []

	#for circles
	for r in regiondisplayset:
		if (r.numregions > 0):
			# data4.append(r.numregions)
			# labels4.append(r.regiondisplay_label)

			value1 = r.id_regiondisplay
			value2 = r.regiondisplay_label
			value3 = r.numregions
			value4 = r.regiondisplay_long
			value5 = r.regiondisplay_lat

			popupcontent = str(value2)
			if value3 > 0:
				popupcontent = popupcontent + ' ' + str(value3)

			properties = {"id_location": value1, "location": value2, "count": value3, "popupContent": popupcontent}
			geometry = {"type": "Point", "coordinates": [value4, value5]}
			location = {"type": "Feature", "properties": properties, "geometry": geometry}
			regionlist.append(location)

	mapdic["features"] = regionlist

	return(mapdic)


# def namecompiler(individual):

# 	print (individual)
# 	individual_object = individual

# 	namevariable = ''
# 	if (individual_object.fk_group != None): namevariable = individual_object.fk_group.group_name
# 	if (individual_object.fk_descriptor_title != None): namevariable = namevariable + " " + individual_object.fk_descriptor_title.descriptor_modern
# 	if (individual_object.fk_descriptor_name != None): namevariable = namevariable + " " + individual_object.fk_descriptor_name.descriptor_modern
# 	if (individual_object.fk_descriptor_prefix1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix1.prefix_english
# 	if (individual_object.fk_descriptor_descriptor1 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor1.descriptor_modern
# 	if (individual_object.fk_descriptor_prefix2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix2.prefix_english
# 	if (individual_object.fk_descriptor_descriptor2 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor2.descriptor_modern
# 	if (individual_object.fk_descriptor_prefix3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_prefix3.prefix_english
# 	if (individual_object.fk_descriptor_descriptor3 != None): namevariable = namevariable + " " + individual_object.fk_descriptor_descriptor3.descriptor_modern
# 	nameout = namevariable.strip()

# 	return(nameout)


#### browse to the next seal description
def nextdescriptionget(currentsealdescription):
	sealdescription_set = Sealdescription.objects.filter(fk_collection=currentsealdescription.fk_collection, catalogue_orderingnumber__gt=currentsealdescription.catalogue_orderingnumber).order_by('catalogue_orderingnumber')

	for i in sealdescription_set:
		print("The next seal description", i, "The Current description", currentsealdescription)
		
		## the code should always return the very first hit that comes after the current page
		return (i)

	return("Nothing returned -- return should actually come from the for loop")


def paginatorJM(currentpage, totalrows, targetobject):

	qpaginationend = int(currentpage) * 10
	qpaginationstart = int(qpaginationend) - 9 

	# if the dataset is less than the page limit
	if qpaginationend > totalrows:
		qpaginationend = totalrows
		qpaginationstart = qpaginationend - 9
		if qpaginationstart < 1:
			qpaginationstart = 1
			currentpage = 1

	if totalrows > 1:
		targetobject = targetobject[qpaginationstart-1:qpaginationend]
	
	totaldisplay = str(qpaginationstart) + " - " + str(qpaginationend)

	pagecountercurrent = currentpage
	pagecounternext = int(currentpage)+1
	pagecounternextnext = int(currentpage)+2

	return(pagecountercurrent, pagecounternext, pagecounternextnext, totaldisplay, qpaginationstart, qpaginationend)

def rdf_generate(digisig_entity_number):
	#Establishing the RDF data
	searchtext = str(digisig_entity_number)

	rdf_object = Rdfview.objects.filter(subject__endswith=searchtext)

	g = Graph()

	for i in rdf_object:

		if i.my_object != None:

			subject = URIRef(i.subject)
			predicate = URIRef(i.predicate)

			if ("http" in i.my_object):
				object1 = URIRef(i.my_object)
			else: object1 = Literal(i.my_object)

			g.add((subject, predicate, object1))

	rdftext_raw = (g.serialize(format='turtle'))
	return (rdftext_raw)


#### creates redirect links from generic URLs 
def redirectgenerator(digisig_entity_number, operation):

	entitynumber = int(digisig_entity_number)

	if (operation == 1): root = "/page/"
	if (operation == 2): root = "/edit/"
	if (operation == 3): 
		root = "/discover/exhibit/"
		targetphrase = root + str(digisig_entity_number)
		return (targetphrase)		

	finalcharacter = (str(digisig_entity_number))[7:] 

	if finalcharacter == '0': stem = "item/"
	if finalcharacter == '1': stem = "seal/"
	if finalcharacter == '2': stem = "manifestation/"
	if finalcharacter == '3': stem = "sealdescription/"
	if finalcharacter == '4': stem = "representation/"
	if finalcharacter == '5': stem = "support/"
	if finalcharacter == '6': stem = "face/"

	#term=7 (10000007-29999997) collection=7(30000007-49999997) and place=7(higher than 49999997...)	
	if finalcharacter == '7':
		if (entitynumber < 29999997): stem = "term/"
		elif (entitynumber < 49999997): stem = "collection/"
		else: stem = "place/" 

	#temp workaround -- parts to redirect to item page
	if finalcharacter == '8': 
		stem = "part/"
		part_object = get_object_or_404(Part, id_part=digisig_entity_number)
		digisig_entity_number = part_object.fk_item.id_item

	if finalcharacter == '9': stem = "actor/"

	targetphrase = root + stem + str(digisig_entity_number)
	
	return (targetphrase)


### create new representation

def representationcreator(entityvalue, form):

	contributor = form.cleaned_data['contributor']
	access = form.cleaned_data['access']
	collection = form.cleaned_data['collection']
	creator = form.cleaned_data['creator']
	representationtype = form.cleaned_data['representationtype']
	rightsholder = form.cleaned_data['rightsholder']
	primacy = form.cleaned_data['primacy']
	dateimage = form.cleaned_data['dateimage']

	#####create a blank representation 
	i = Representation()

	#add standard values
	i.representation_date = datetime.now()
	i.fk_connection = get_object_or_404(Connection.objects, pk_connection=28)
	i.fk_connection_alternate = 1

	## Image Location -- where does the file come from?
	i.original_representation_filename = imagelocation

	#Entityvalue -- establish entity
	i.fk_digisig = entityvalue

	#test to see what type of entity is being added
	digisigentity = str(entityvalue)
	finalcharacter = digisigentity[7:]

	#if it is manifestation=2, then prepare additional value
	if finalcharacter == '2':
		i.fk_manifestation = get_object_or_404(Manifestation, id_manifestation=entityvalue)

	#Contributor -- default 10 (Anonymous)
	if contributor < 0:
		targetcontributor = get_object_or_404(Contributor.objects, pk_contributor=contributor)
	else: 
		targetcontributor = get_object_or_404(Contributor.objects, pk_contributor=10)
	i.fk_contributor = targetcontributor

	#Access -- default 1 (Public)
	if access < 0:
		accesslevel = get_object_or_404(Access.objects, pk_access= access)
	else: 
		accesslevel = get_object_or_404(Access.objects, pk_access= 1)
	i.fk_access = accesslevel

	#collection -- default to 30000187 -- [30]
	if collection < 0:
		targetcollection = get_object_or_404(Collection.objects, id_collection=collection)
	else: targetcollection = get_object_or_404(Collection.objects, id_collection=30000187)
	i.fk_collection = targetcollection

	#i.fk_collection_old = targetcollection.collection

	#Creator -- default 11 (Anonymous)
	if creator < 0: 
		targetcreator = get_object_or_404(Contributor.objects, pk_contributor=creator)
	else: targetcreator = get_object_or_404(Contributor.objects, pk_contributor=10)
	i.fk_contributor_creator = targetcreator

	#Primacy - default?
	if primacy == 1:
		i.primacy = primacy
	else: i.primacy = 0

	#Representation type -- default 6 (Undetermined)
	if representationtype < 0:
		targettype = get_object_or_404(RepresentationType.objects, pk_representation_type=representationtype)
	else: targettype = get_object_or_404(RepresentationType.objects, pk_representation_type=6)
	i.fk_representation_type = targettype

	#Rights Holder -- default 5 {undetermined} 
	if rightsholder < 0:
		print("rightsholder", rightsholder)
		targettype = Rightsholder.objects.get(pk_rightsholder=rightsholder)
	else: targettype = Rightsholder.objects.get(pk_rightsholder=5)
	i.fk_rightsholder = targettype

	i.save()

	#find out what id it got
	print ("new representation", i.pk)
	newimage = str(i.pk)
	print (newimage)

	imagesuffix = entityvalue
	fullfilename = str(newimage) + "_" + str(imagesuffix) + ".jpg"

	i.representation_thumbnail= fullfilename
	i.representation_filename = fullfilename

	i.save()
	print (i)

	#Note-- only works with internet files -- possible root to local files ''This function's location has changed in Python 3. It is now urllib.request.pathname2url.'''
	#Alternative --- im = Image.open(r"C:\Users\System-Pc\Desktop\ybear.jpg") [PIL]

	#####where files will go

	#roots
	imagesaveroot1 = "D:/Archive/1x_photorepository_original/"
	imagesaveroot2 = "D:/Archive/1x_photorepository_original/original/"
	imagesaveroot3 = "D:/Archive/1photorepository/medium/"
	imagesaveroot4 = "D:/Archive/1photorepository/small/"
	imagesaveroot5 = "D:/Archive/1z_photorepository_working/backblazeupload/medium/"
	imagesaveroot6 = "D:/Archive/1z_photorepository_working/backblazeupload/small/"

	#formulate the full filename 						
	imagelocal = imagesaveroot1 + fullfilename
	imagelocal2 = "D:/Archive/1x_photorepository_original/original2/" + fullfilename

	print ("#######", imagelocation)

	#test to see if file resides in a internet or local directory 
		#if internet -- download and save to file name represented by imagelocal
	if (imagelocation[3:] == "http"):
		inputimage = urllib.request.urlretrieve(imagelocation, imagelocal)
		im = Image.open(imagelocal)

	else:
		shutil.copy2(imagelocation, imagelocal)
		shutil.copy2(imagelocation, imagelocal2)
		#shutil.move(imagelocation, imagelocal2)
		im = Image.open(imagelocation)

	widthimage, heightimage = im.size
	i.width = widthimage
	i.height = heightimage
	i.save()

	# image_out2 = imagesaveroot2 + fullfilename
	# im.save(image_out2, "JPEG")

	sizemedium = (500,500)
	im.thumbnail(sizemedium)

	##the medium
	image_out3 = imagesaveroot3 + fullfilename
	im.save(image_out3, "JPEG")
	image_out5 = imagesaveroot5 + fullfilename
	im.save(image_out5, "JPEG")

	sizethumb = (200,200)
	im.thumbnail(sizethumb)

	##the thumbnails
	image_out4 = imagesaveroot4 + fullfilename
	im.save(image_out4, "JPEG")
	image_out6 = imagesaveroot6 + fullfilename
	im.save(image_out6, "JPEG")

	#default True
	if i.primacy == True:
		# test if there are other images of this thing and IF NOT then make it primary (revise this code)
		representation_set = Representation.objects.filter(fk_digisig=entityvalue)
		existingimagecount = representation_set.count()
		print('existingcount:', existingimagecount)

		if (existingimagecount > 0):
			representation_other = representation_set.exclude(id_representation=i.pk)

			#ensure that other images are not primary
			for r in representation_other:
				print(r)
				r.primacy = False 
				r.save()

	return (i)