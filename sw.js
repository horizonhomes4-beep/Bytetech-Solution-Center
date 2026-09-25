const CACHE_NAME = "mathcloud-tutorial-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo.png"
];


/* INSTALL */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())

  );

});


/* ACTIVATE */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/* FETCH */

self.addEventListener("fetch", event => {

  /*
   * Only handle GET requests.
   */
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(

    fetch(event.request)
      .then(response => {

        /*
         * Save successful responses.
         */
        const responseClone = response.clone();

        caches.open(CACHE_NAME)
          .then(cache => {

            cache.put(
              event.request,
              responseClone
            );

          });

        return response;

      })
      .catch(() => {

        /*
         * If internet is unavailable,
         * try cached copy.
         */
        return caches.match(event.request);

      })

  );

});
