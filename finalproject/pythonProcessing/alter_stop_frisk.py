#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Feb 16 18:10:07 2018

@author: aweintraut
"""
import pandas as pd
import numpy as np
from sklearn import preprocessing
from pyproj import Proj, transform

# PROCESS SQF
data = pd.read_csv('sqf-2015.csv')
df = pd.DataFrame(data, columns=['year','pct','ser_num','datestop','timestop',
            'recstat','inout','trhsloc','perobs','crimsusp','perstop','typeofid',
            'explnstp','othpers','arstmade','arstoffn','sumissue','sumoffen',
            'compyear','comppct','offunif','officrid','frisked','searched',
            'contrabn','adtlrept','pistol','riflshot','asltweap','knifcuti',
            'machgun','othrweap','pf_hands','pf_wall','pf_grnd','pf_drwep',
            'pf_ptwep','pf_baton','pf_hcuff','pf_pepsp','pf_other','radio',
            'ac_rept','ac_inves','rf_vcrim','rf_othsw','ac_proxm','rf_attir',
            'cs_objcs','cs_descr','cs_casng','cs_lkout','rf_vcact','cs_cloth',
            'cs_drgtr','ac_evasv','ac_assoc','cs_furtv','rf_rfcmp','ac_cgdir',
            'rf_verbl','cs_vcrim','cs_bulge','cs_other','ac_incid','ac_time',
            'rf_knowl','ac_stsnd','ac_other','sb_hdobj','sb_outln','sb_admis',
            'sb_other','repcmd','revcmd','rf_furt','rf_bulg','offverb','offshld',
            'forceuse','sex','race','dob','age','ht_feet','ht_inch','weight',
            'haircolr','eyecolor','build','othfeatr','addrtyp','rescode',
            'premtype','premname','addrnum','stname','stinter','crossst',
            'aptnum','city','state','zip','addrpct','sector','beat',
            'post','xcoord','ycoord','dettypCM','lineCM','detailCM']
            )
#Remove Columns we don't need
df = df.drop(columns = ['year','pct','ser_num', 'inout','trhsloc',
                        'perobs','typeofid','explnstp','sumissue','sumoffen',
                        'compyear','comppct','adtlrept','radio','offunif','officrid',
                        'ac_rept','ac_inves','rf_vcrim','rf_othsw','ac_proxm','rf_attir',
                        'cs_objcs','cs_descr','cs_casng','cs_lkout','rf_vcact','cs_cloth',
                        'cs_drgtr','ac_evasv','ac_assoc','cs_furtv','rf_rfcmp','ac_cgdir',
                        'rf_verbl','cs_vcrim','cs_bulge','cs_other','ac_incid','ac_time',
                        'rf_knowl','ac_stsnd','ac_other','sb_hdobj','sb_outln','sb_admis',
                        'sb_other','repcmd','revcmd','rf_furt','rf_bulg','offverb','offshld',
                        'dob','ht_feet','ht_inch','weight',
                        'haircolr','eyecolor','build','othfeatr','addrtyp','rescode',
                        'premtype','premname','addrnum','stname','stinter','crossst',
                        'aptnum','city','state','addrpct','sector','beat',
                        'post','dettypCM','lineCM','pf_hands','pf_wall','pf_grnd',
                        'pf_drwep','pf_ptwep','pf_baton','pf_hcuff','pf_pepsp',
                        'pf_other','contrabn','pistol','riflshot','asltweap',
                        'knifcuti','machgun','othrweap', 'othpers', 'perstop',
                        'crimsusp', 'recstat', 'arstoffn', 'zip'])



df['timestop'] = df['timestop'].astype(str)
#Get rid of whitespace and rows with invalid values in coordinates
df['xcoord'] = df['xcoord'].str.replace(" ","")
df['ycoord'] = df['ycoord'].str.replace(" ","")
df['xcoord'] = df['xcoord'].str.strip()
df['ycoord'] = df['ycoord'].str.strip()
df = df[pd.notnull(df['xcoord'])]
df = df[pd.notnull(df['ycoord'])]
df = df[df['xcoord'] != '']
df = df[df['ycoord'] != '']
# Get rid of whitespace for string values
df['arstmade'] = df['arstmade'].str.replace(" ","")
df['arstmade'] = df['arstmade'].str.strip()
df['frisked'] = df['frisked'].str.replace(" ","")
df['frisked'] = df['frisked'].str.strip()
df['searched'] = df['searched'].str.replace(" ","")
df['searched'] = df['searched'].str.strip()
df['forceuse'] = df['forceuse'].str.replace(" ","")
df['forceuse'] = df['forceuse'].str.strip()
df['sex'] = df['sex'].str.replace(" ","")
df['sex'] = df['sex'].str.strip()
df['race'] = df['race'].str.replace(" ","")
df['race'] = df['race'].str.strip()
#Remove duplicate records
df_valid = df.drop_duplicates()
df_valid = df_valid[df_valid['timestop'].str.len() > 2]
#Iterate through each row and convert State Plane Coordinates to Lat/Long
for index, row in df_valid.iterrows():
    x1,y1 = float(row['xcoord']), float(row['ycoord'])
    conversionFactor = 0.304800609601219
    #x1,y1 = 1000091, 156314
    #x1 = x1*conversionFactor
    #y1 = y1*conversionFactor
    inProj = Proj(init='epsg:2263', preserve_units = True)
    outProj = Proj(init='epsg:4326', preserve_units = True)
    x2,y2 = transform(inProj,outProj,x1,y1)
    df_valid.at[index, 'xcoord'] = x2 #set_value(index,'xcoord',x2)
    df_valid.at[index, 'ycoord'] = y2 #set_value(index,'ycoord',y2)
    #print(str(y2) + ','+ str(x2))
    #
    # ALSO CONVERT TIME TO 4 VALUES
    #print(len(str(row['timestop'])))

    if(len(df_valid.at[index, 'timestop']) == 3):
        df_valid.at[index, 'timestop'] = '0' + row['timestop']







#Rename columns to long/lat
df_valid = df_valid.rename(index=str, columns={'xcoord': 'longitude', 'ycoord': 'latitude'})

#Reformat Date
df_valid['datestop'] = pd.to_datetime(df_valid['datestop'], format='%m%d%Y', errors='ignore')
df_valid['timestop'] = pd.to_datetime(df_valid['timestop'], format='%H%M', errors='ignore')
#df_valid['datestop'] = df_valid['datestop'].dt.strftime("%Y-%m-%d")
#df_valid = df_valid.sort_values(['datestop'], ascending=True)

#df_valid['timestop'] = pd.strfdatetime(df_valid['timestop'], format='%H:%M', errors='ignore')
#reset index
df_valid = df_valid.reset_index()

# GET ZIP CONVERTED FROM REVERSE GEOCODING
zip_data = pd.read_csv('lat_long.csv')
getZip_df = pd.DataFrame(zip_data, columns = ['index','longitude','latitude','Address','street_num','Street','City','State','Country','Zip','addr_comp'])
getZip_df = getZip_df.drop(columns = ['index','longitude','latitude','Address','street_num','Street','City','State','Country','addr_comp'])
zip_code_column = getZip_df['Zip']

# MERGE ZIP CODE COLUMN WITH DF
frames = [df_valid, getZip_df]
df_valid = pd.concat(frames, axis=1)
df_valid = df_valid.drop(columns = 'index')
df_valid = df_valid.dropna(subset = ['longitude', 'latitude', 'Zip'])
df_valid = df_valid.reset_index()
df_valid = df_valid.drop(columns = 'index')
print(df_valid)
#Save to new location
df_valid.to_csv('../csv/stop_frisk.csv')
print("DONE STOP FRISK SAVING TO CSV")
