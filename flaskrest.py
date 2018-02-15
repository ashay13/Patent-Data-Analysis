######### Python web application using Flask and ElasticSearch and using Rest API endpoints in Angular JS #########
from elasticsearch import Elasticsearch
from flask import Flask,jsonify , render_template
from flask import request
import copy
import collections
import os

application = Flask(__name__)
countryAbbrDict={}
with open('countries.csv', 'r') as fobj:
    for line in fobj:
        words=line.split(",")
        countryAbbrDict[words[1]]=words[0]

try:
  HOST = os.environ['ES_HOST']
except:
  HOST =  "192.168.0.64"

ES_HOST = {"host" : HOST, "port" : 9200}

es = Elasticsearch(hosts = [ES_HOST])


# function returning the month's name, provided by its number
def getMonthName(name):
    if name == 1:
        return "Jan"
    if name == 3:
        return "March"
    if name == 4:
        return "Apr"
    if name == 6:
        return "Jun"
    if name == 7:
        return "Jul"
    if name == 9:
        return "Sept"
    if name == 10:
        return "Oct"
    if name == 12:
        return "Dec"

#index.html will be shown when we hit url eg) localhost:5000
@application.route('/')
def hello():
  return render_template('index.html')

#Get aggragation of Country  list
@application.route('/api/aggregations/by_countries',methods=['GET'])
def get_aggregations_by_countries():
  query = {
    "size" : 0,
    "aggs" : {
        "countries" : {
            "terms" : {
              "field" : "first_assignee.assignee_lastknown_country.keyword",
               "size" : 10000
            }
         }
      }
  }
  results = es.search(index="patents",body=query)
  response = { "aggregations" : results["aggregations"]["countries"]["buckets"],"total" : results["hits"]["total"] }

  for key in response['aggregations']:
      if key['key'] in countryAbbrDict:
          key['abbr'] = key['key']
          key['key']=countryAbbrDict[key['key']]


  return jsonify(response)

#get data for trend analytics
@application.route('/api/trend_analysis',methods=['GET'])
def get_aggregations_by_trend_analysis():
    query = {
        "query": {}
    }
    results = es.search(index="keywords",body=query)
    response = { "aggregations" : results["keywords"]["buckets"],"total" : results["hits"]["total"] }
    return jsonify(response)


# Aggregation of states
@application.route('/api/aggregations/by_states',methods=['GET'])
def get_aggregations_by_states():
  country = request.args.get('country')
  query = {
    "size" : 0,
    "query" : {
        "term" : { "first_assignee.assignee_lastknown_country" : country }
    },
    "aggs" : {
        "states" : {
            "terms" : {
              "field" : "first_assignee.assignee_lastknown_state.keyword",
               "size" : 5
            }
         }
      }
  }
  results = es.search(index="patents",body=query)
  response = { "aggregations" : results["aggregations"]["states"]["buckets"],"total" : results["hits"]["total"] }
  return jsonify(response)

#Aggregation of organizations
@application.route('/api/aggregations/by_organizations',methods=['GET'])
def get_aggregations_by_organizations():

  query = {
    "size" : 0,
    "query" : {
    },
    "aggs" : {
        "orgs" : {
            "terms" : {
              "field" : "first_assignee.assignee_organization.keyword",
               "size" : 1000
            }
         }
      }
  }


  results = es.search(index="patents",body=query)
  response = { "aggregations" : results["aggregations"]["orgs"]["buckets"],"total" : results["hits"]["total"] }
  return jsonify(response)

# get sector data
@application.route('/api/getSectorData',methods=['GET'])
def getSectorData():

    query={
    "size" : 0,

    "aggs" : {
        "sector_cnt" : {
            "terms" : {
              "field" : "wipos.wipo_sector_title.keyword"

            }
        }

    }
    }
    results = es.search(index="patents", body=query)
    return jsonify(results['aggregations'])

@application.route('/api/geo_json/countries',methods=['GET'])
def get_geo_json_for_countries():

  query = {
    "size" : 10,
    "query" : {
        "match_all" : { }
    }
  }
  countriesGeoJSONresponse = es.search(index="countries",body=query)

  return jsonify(countriesGeoJSONresponse)

@application.route('/api/geo_json/states',methods=['GET'])
def get_geo_json_for_states():

  query = {
    "size" : 200,
    "query" : {
        "match_all" : { }
    }
  }
  results = es.search(index="states",body=query)
  response = results["hits"]
  return jsonify(response)


@application.route('/api/getCountriesMapData',methods=['GET'])
def getCountriesMapData():
    query = {
        "size": 5000,
        "query": {
            "match_all": {}
        }
    }
    countriesGeoJSONresponse = es.search(index="countries", body=query)

    selectedCountryList = request.args.getlist('countryList')
    selectedToDate = request.args.get('toDate')
    selectedFromDate = request.args.get('fromDate')

    query = {
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {"terms": {"first_assignee.assignee_lastknown_country.keyword": selectedCountryList }},
                        {"range": {
                            "applications.app_date": {
                                "gte": selectedFromDate,
                                "lte": selectedToDate,
                                "format": "yyyy-mm-dd"
                            }
                        }
                    }
                ]
            }
        },
    "aggs" : {
        "countries" : {
            "terms" : {
              "field" : "first_assignee.assignee_lastknown_country.keyword",
              "size": 10000
            }
         }
      }
    }

    results = es.search(index="patents", body=query)
    countriesAgg = {"aggregations": results["aggregations"]["countries"]["buckets"], "total": results["hits"]["total"]}
    countriesAggDict = {}
    for key in countriesAgg['aggregations']:
        countriesAggDict[key['key']] = key['doc_count']


    totalData = {}
    geoCountriesArray = []
    for key in countriesAggDict:

        geojson = {}
        geometry = {}
        properties = {}

        for d in countriesGeoJSONresponse['hits']['hits']:

            geojson = {}
            geometry = {}
            properties = {}

            geometry = d['_source']['geometry']
            geojson['type'] = "Feature"
            geojson['id'] = d['_id']
            geojson['geometry'] = geometry
            properties['name'] = d['_source']['name']
            geojson['properties'] = properties
            abbr = d['_source']['abbr']
            properties['abbr'] = abbr

            if str(abbr).upper() == key:

                properties['density'] = countriesAggDict[key]
                geoCountriesArray.append(geojson)

    totalData['type'] = "FeaturesCollection"
    totalData['features'] = geoCountriesArray


    return jsonify(totalData)


#
# gets the sector distribution across the organization's
#
@application.route('/api/getStackBarChartData', methods=['GET'])
def getStackBarChartData1():

    selectedCList = request.args.getlist('orgList')

    if selectedCList == []:
        selectedCompanyList = ["Samsung Electronics Co., Ltd.","International Business Machines Corporation","Canon Kabushiki Kaisha","Google Inc.","Kabushiki Kaisha Toshiba"]

    if selectedCList != []:
        selectedCompanyList = selectedCList

    selectedToDate = request.args.get('toDate')
    selectedFromDate = request.args.get('fromDate')

    defaultSector = ["Electrical engineering", "Instruments", "Mechanical engineering", "Chemistry", "Other fields"]
    query = {
           "size": 0,
            "query" : {
             "bool" : {
              "must" : [
              {"terms": {"first_assignee.assignee_organization.keyword": selectedCompanyList }},
                { "range" : {
                    "applications.app_date" : {
                        "gte" : selectedFromDate,
                        "lte" :  selectedToDate,
                        "format" : "yyyy-mm-dd"
                    }
                    }
                }
              ]
            }
            },
            "aggs" : {
            "orgs" : {
                 "terms": { "field": "wipos.wipo_sector_title.keyword" },

                "aggs": {
          "sector": {

               "terms" : {
                     "missing": "n/a"  ,
                  "field" : "first_assignee.assignee_organization.keyword"
                 }
               }
            }

        }
        }

    }
    results = es.search(index="patents", body=query)
    val = results['aggregations']['orgs']['buckets']

    # for buckets
    for res in val:
        copyDefault = copy.deepcopy(selectedCompanyList)
        # for each key in bucket
        for r in res['sector']['buckets']:
            for i in selectedCompanyList:
                if r['key'] == i:
                    copyDefault.remove(i)

        for i in copyDefault:
            l = {}
            l['key'] = i
            l['doc_count'] = 0
            res['sector']['buckets'].append(l)

    return jsonify(results['aggregations'])

@application.route('/api/getLineChartData', methods=['GET'])
def getLineChartData():

    #s_date = request.args.get('startDate')
    #e_date = request.args.get('endDate')

    dataDict={}
    keywordDateDict={}

    query = {
       "size" : 5000,
       "sort" : [
            { "score" : {"order" : "desc"}}
        ]

    }
    results = es.search(index="keywords", body=query)

    for obj in results['hits']['hits']:

        if obj['_source']['keyword'] in dataDict:

            value = dataDict[obj['_source']['keyword']]
            year = str(obj['_source']['e_year_m']).split('-')[0]
            latestKeyScore  = obj['_source']['score'] * 100

            if year in value:
                previousScore = value[year]

                if previousScore >= latestKeyScore:
                    latestKeyScore = previousScore

            value[year] = latestKeyScore

        else:
            #new keyword
            keywordDateDict = {}
            keywordDateDict['2013']=0
            keywordDateDict['2014'] = 0
            keywordDateDict['2015'] = 0
            keywordDateDict['2016'] = 0
            year=str(obj['_source']['e_year_m']).split('-')[0]
            keywordDateDict[year]=obj['_source']['score'] * 100
            dataDict[obj['_source']['keyword']]=keywordDateDict


    return jsonify(dataDict.items())



@application.route('/api/getLineChartDataQuarterly', methods=['GET'])
def getLineChartDataQuarterly():

    #s_date = request.args.get('startDate')
    #e_date = request.args.get('endDate')
    startDateArr=[12,9,6,3]
    endDateArr=[10,7,4,1]
    year=2015

    selectedYear = request.args.get('selectedYear')

    dataDict={}
    keywordDateDict={}

    query = {
    "size" : 1000,
    "query": {
        "wildcard": {
            "s_year_m.keyword": selectedYear+"-*"
        }
    }
    }


    results = es.search(index="keywords", body=query)

    for obj in results['hits']['hits']:

        if obj['_source']['keyword'] in dataDict:

            value = dataDict[obj['_source']['keyword']]
            e_m = str(obj['_source']['e_year_m']).split('-')[1]
            s_m = str(obj['_source']['s_year_m']).split('-')[1]
            key = e_m
            latestKeyScore  = obj['_source']['score'] * 100
            if key in value:
                previousScore = value[key]

                if previousScore >= latestKeyScore:
                    latestKeyScore = previousScore

            value[key] = latestKeyScore

        else:
            #new keyword}
            keywordDateDict = collections.OrderedDict()
            keywordDateDict['1'] = 0
            keywordDateDict['4'] = 0
            keywordDateDict['7'] = 0
            keywordDateDict['10'] = 0

            e_m=str(obj['_source']['e_year_m']).split('-')[1]
            s_m=str(obj['_source']['s_year_m']).split('-')[1]

            keywordDateDict[e_m]=obj['_source']['score'] * 100
            dataDict[obj['_source']['keyword']]=keywordDateDict

    return jsonify(dataDict.items())

@application.route('/api/getCirclePackingData', methods=['GET'])
def getCirclePackingData():
    patents_data = { "name": "Patents","children":[]}
    start_year=2016
    end_year=2013
    for year in range(start_year,end_year-1,-1):
        year_data= { "name": "Year : "+str(year),"children":[]}

        if year==2016:
            start_month=3
        else:
            start_month=12
        for month in range(start_month,0,-3):
	    month_data= { "name": "Months : "+getMonthName(month-3+1)+"-"+getMonthName(month),"children":[]}
            jc_query = {
                    "_source":["score","keyword","orgs"],
                    "size": 10000,
                    "query": {
                    "bool" : {
                    "must" : [
                    { "term" : { "wipo.keyword" : "Computer technology" } },
                    { "term" : {"s_year_m.keyword" : str(year)+"-"+str(month)} },
                    { "term" : {"e_year_m.keyword" : str(year)+"-"+str(month-3+1)} }
                    ]
                    }
                }
            }

            es_jc_docs = es.search(index="keywords", body=jc_query)

	    for es_doc in es_jc_docs["hits"]["hits"]:
                orgs = map(lambda x: {"name" : x, "size":int(es_doc["_source"]["score"]*10000000) } , es_doc["_source"]["orgs"])
		doc = {"name": es_doc["_source"]["keyword"],"children": orgs}
                month_data["children"].append(doc)
	    year_data["children"].append(month_data)

        patents_data["children"].append(year_data)

    return jsonify(patents_data)



if __name__=="__main__":

  application.run(host=HOST,port=80,debug=True)

