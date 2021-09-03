# Trail Angeles

TrailAngeles.org is a website to manage volunteer groups, recruit new volunteers, and provide accurate information on trails, hiking and other eductional programs in the Angeles National Forest.

### Acknowledgements

TrailAngeles was designed by https://susiethai.com/. Design and maintenance is sponsored by REI https://rei.com/. The project is maintained and stewarded by LA Nature For All https://lanatureforall.org/ in partnership with the Angeles National Forest. The code was developed pro-bono by Studio Gomashio https://gomashio.org/.

## Getting Started

If you want to contribute to the content of the website, you can start by checking out our contributing guide: https://trailangeles.org/posts/contributing-to-trailangeles/

If you are interested in the code of the website, read on!

### Technologies used:

Based on https://github.com/surjithctly/neat-starter

- [Netlify CMS](https://www.netlifycms.org/)
- [Eleventy](https://www.11ty.dev/)
- [Alpine.js](https://github.com/alpinejs/alpine)
- [Tailwind CSS](https://tailwindcss.com/)
- [Leaflet](https://leafletjs.com/)
- [MapTiler](https://leafletjs.com/)

### How TrailAngeles works

Every commit to the main branch triggers a build on Netlify, which runs `npm run build` and then deploys the site to TrailAngeles.org. There is also an admin interface at https://trailangeles.org/admin which is powered by Netlify CMS. Edits done through the Admin UI create GitHub commits. If the user is not a member of the TraiLAngeles GitHub Organization, their edits will create a Pull Request that can be merged by one of the maintainers of this repo. That way any GitHub user can use the user-friendly Admin UI to make content contributions.

All content is stored as JSON inside the `src/_data` folder, so edits to the content can be made directly via Git/GitHub and we also get version control for all content on the site.

The site is deployed via Netlify as a 100% static site which makes it essentially free to run and very fast as there is no traditional database behind the site and everything sits in a CDN.

#### Admin

Our Admin UI is configured entirely via this file https://github.com/trailangeles/trailangeles/blob/master/src/admin/config.yml. This is a pretty cool part of Netlify CMS, you can build the Admin UI entirely from Yaml and the UI is built on page load using their Admin framework, meaning the only 'backend' requirement for our site is the Netlify Admin script tag.

#### Maps

For our maps we use MapTiler's free plan for our backend and render the frontend using Leaflet with the Mapbox GL plugin. We use the MapTiler Outdoors layer https://docs.maptiler.com/schema/outdoor/ to get vector tiles that can render trails at low zoom levels (10+ vs 14+ if the trail isn't in the Outdoors layer). For this to work the trails need a `sac_scale=hiking` tag on OSM or for MTB trails they need a `mtb:scale` tag applied, that way they get included in the Outdoors layer. Other trails can still be styled but only show up on zoom level 14+ due to limitations with how much data is included in the default Planet layer tiles on MapTiler. You can grab a copy of our mapstyle.json in this repo.

Work in progress: We have a field in our Admin UI to link an OSM Way ID to a specific Place on our site. When we render the map for that Place we want to use this metadata to highlight the trail in the GL renderer. We also want to pull in tags from OSM for these Ways whenever the site builds so we can render them on the site as metadata, for example for trail open/closed statuses.

#### Events

We have a GitHub Action that imports a shared Google Calendar every hour into the site, and checks the calendar events in as JSON, which triggers a build on our site if there were new events. https://github.com/maxogden/google-calendar-import/

Add a link in the Event Description in Google Calendar:

<img width="498" alt="image" src="https://user-images.githubusercontent.com/3673236/132067672-b5a3a804-cdaa-44c3-8e1a-ed1c0135f2ce.png">


### Running the website locally

```
git clone https://github.com/trailangeles/trailangeles
cd trailangeles
npm install
npm run build
npm start
```

Now open `http://localhost:8080` in your browser. Edits will reload the site, and edits to config.yml will reload the `/admin` UI.

### Opening Pull Requests

We welcome contributions to the site from the public. If you are going to spend a lot of time on a Pull Request, but aren't sure if your feature will be useful to us, feel free to open an Issue with your idea and get our feedback first. 
