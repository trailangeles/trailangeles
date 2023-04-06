let cacheName = 'offline-store'

var cache = async (req, res) => {
  const cache = await caches.open(cacheName)
  console.log(`[Service Worker] Caching new resource: ${req.url}`)
  await cache.put(req, res.clone())
  // var currentPage = req.referrer
  // var cached = await cache.match(currentPage)
  // if (!cached) {
  //   console.log(`[Service Worker] Caching page: ${currentPage}`)
  //   await cache.add(currentPage)
  // }
  return res;
}

self.addEventListener("fetch", (e) => {
  var handler = async () => {
    if (!e.request.url.startsWith('http')) {
      console.log(`[Service Worker] Skipping: ${e.request.url}`)
      return fetch(e.request)
    }

    let response
    try {
      response = await fetch(e.request)
      await cache(e.request, response)
      return response
    } catch (err) {
      console.log("Fetch error", err)
      console.log(`[Service Worker] Serving from cache: ${e.request.url}`)
      return caches.match(e.request)
    }
  }

  e.respondWith(handler())
})
