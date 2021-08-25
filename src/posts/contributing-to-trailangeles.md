---
title: Contributing to TrailAngeles
description: How to add, edit or improve the information on the site
author: Max
date: 2021-08-12T22:06:17.661Z
---
All of the information on Trail Angeles is contributed by volunteers, and anyone can make a new edit. You might find some information is out of date, or there might be a trail missing, or maybe you took a great photo for a group that you'd like to upload.

## Editing the website

### Step 1: Create a free GitHub account

Our website is hosted on a site called GitHub. You will need a free GitHub account in order to sign in to our sites CMS (Content Management System), but the CMS is user friendly and you don't need to know how to code to use it.

### Step 2: Login to the CMS

You can access the CMS by visiting <https://trailangeles.org/admin>. Sign in using your GitHub account and then you will see something like this:

![](/static/img/screenshot_20210812_150939.jpg "Admin Home")

Each of these categories on the left represents content displayed on Trail Angeles. Each one is a collection of data that can be edited and saved to the site from the CMS. Here's a breakdown of what each one is:

* **Organizations**: Each organization has its own page. When editing an organization you set the group photo as well as the places they maintain. Make sure to add 'Requirements' in the description listing what volunteers need to have before volunteering with this org.
* **Places**: Each Place has its own page. Places are for well known areas or destinations like Eaton Canyon or the Sam Merrill Trail. Organizations can be linked to list of places they maintain
* **Events**: This collection is directly pulled from a shared Google Calendar. If you have access to edit the calendar, you can create an event and it will get synced to this collection at the top of the next hour. It's best to edit details on the calendar and not in the admin for Events.
* **Points**: Points are for smaller specific areas like a bathroom or a trailhead. You can associate a place with multiple points. A point shows up on the map with a custom icon
* **Sortable Filters**: The list of filters that shows up on the Volunteer Groups page. The filters defined here can be chosen when you edit the Volunteer Groups collection, and make the filtering on the site work.
* **Settings > Alert**: You can set the text linked in the orange alert bar here
* **Blog**: You can edit any blog post here. We use the blog for the site FAQ and this very guide you are reading

## Editing the maps

The maps we use are generated from [OpenStreetMap](https://www.openstreetmap.org/) data. The baselayer is a custom layer we created on MapTiler that [highlights outdoor trails](https://docs.maptiler.com/schema/outdoor/). There are three ways to help make our maps better:

### 1. Editing Places/Points in the CMS

You can use Places and Points in the CMS to enrich the map views on a given page. For example, if you are editing the Eaton Canyon place page, you can help us out by creating Points around Eaton Canyon that are helpful to the public (like Parking, Bathrooms and Trailheads) and then linking the Place to the Points you created so they show up on the map

### 2. Editing OpenStreetMap

The brown and orange trails you see on the map come from [OpenStreetMap.org](https://www.openstreetmap.org/). To see an example of editing OpenStreetMaps see this video: <https://www.youtube.com/watch?v=5q7ypL0Osqc>. Most of the trails in the Angeles are already added to OSM, but they are missing valuable metadata. You can help us out by picking some trails and checking them for these properties:

* **Hiking Trails**: Help us make sure that all hiking trails have these tags: `sac_scale: hiking` and `highway: path`. There is a page about this tag on the [OSM wiki here](https://wiki.openstreetmap.org/wiki/Key:sac_scale). Many of the trails only have `highway: path` but they are missing `sac_scale: hiking`. If you find a trail without `sac_scale: hiking` but you are sure it's a hiking trail, then go ahead and add it. This will make that trail show up in the MapTiler Outdoors layer which we use in our maps. 
* **MTB Trails**: For MTB Trails to show up on the MapTiler Outdoors layer we need them to have a `mtb:scale` tag. [Here is more info on this tag.](https://wiki.openstreetmap.org/wiki/Key:mtb:scale) Many of our trails are advanced and would be considered a `mtb:scale=2` or `mtb:scale=3`. Please help us out by adding this tag to all the trails you have ridden!
* **POIs**: We do render [POIs](https://wiki.openstreetmap.org/wiki/Points_of_interest) like Parking Lots on our basemap. They aren't clickable so you wno't be able to have a pop-up description like if you added the same one as a Point in our system, but having them on OSM as well doesn't hurt!

Tip: On our basemap, we render the trails that have been successfully tagged already with one of the above `sac_scale` or `mtb:scale` tags as **brown**. The ones that don't yet have this tag are dotted **orange**. So if you are unsure what to do, look for a dotted orange trail that you feel confident in tagging. Note that once you make the edit, it may take a week or two before the change makes it live on our site.

### 3. Linking OSM Ways to Places

Inside our Admin page under the Places editor you will see a field that lets you enter in a 'OSM Way ID' and link it to a Place. For example, our entry for the Sam Merrill Trail is linked to this OSM Way: <https://www.openstreetmap.org/way/178426128#map=15/34.2190/-118.1163>. This means we can create a better experience on the map by highlighting the specific trail that this Place refers to, and we can also import tags for that trail and use them to enrich the info we show for that trail on the site.

You can help us out by looking up the OSM Way for any Places that are for specific trails, and making sure they are linked correctly. To look up a Way the easiest way is to search for it by name on OpenStreetMap.org. You can also get a link to a Way you are editing from the Edit view of the ID editor at the bottom of the editing properties window.

Sometimes a trail will be split across multiple Ways. In that case you can either just link the Way that includes the trailhead, or a more advanced solution would be to edit OSM to combine these Ways into 1 Way if it makes sense to do so.