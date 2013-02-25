(function ($) {

    Drupal.leaflet_widget = Drupal.leaflet_widget || {};

    Drupal.behaviors.geofield_widget = {
        attach: attach
    };

    function attach(context, settings) {
        $('.leaflet-widget').once().each(function(i, item) {
            var id = $(item).attr('id'),
            options = settings.leaflet_widget_widget[id];

            //var map = L.map('map').setView([37.8, -96], 4);
            var map = L.map(id, options.map);

            // For testing. TODO: remove.
            //var cloudmade = L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
             // attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2011 CloudMade',
             // key: 'BC9A493B41014CAABB98F0471D759707',
             // styleId: 998
            //}).addTo(map);

            var Items = new L.FeatureGroup().addTo(map);

            var drawControl = new L.Control.Draw({
                draw: {
                  position: 'topleft',
                  polygon: {
                    title: 'Draw a polygon',
                    allowIntersection: false,
                    drawError: {
                      color: '#b00b00',
                      timeout: 1000
                    },
                    shapeOptions: {
                      color: '#bada55'
                    }
                  },
                  // TODO: Make this an option.
                  circle: false       },
                edit: {
                  featureGroup: Items
                }

              });

              map.addControl(drawControl);

              map.on('draw:created', function (e) {
                var type = e.layerType,
                  layer = e.layer;

                // Grabbing map values, ignoring the first two layers which are the controls.
                // TODO: Will move into function that will fire upon submit.
                var i = 1;
                var x = 0;
                for (var key in map._layers) {
                  if (x > i) {
                    console.log(map._layers[key]);
                  }
                  x++;
                }
                Items.addLayer(layer);
              });

            // TODO: Need to add a function to grab map values upon submit.
            //$(item).parents('form').bind('submit', $.proxy(map.widget.write, map.widget));

            Drupal.leaflet_widget[id] = map;
        });
    }

}(jQuery));
