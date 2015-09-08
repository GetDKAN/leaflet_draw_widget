(function ($) {

  Drupal.leaflet_widget = Drupal.leaflet_widget || {};

  Drupal.behaviors.geofield_widget = {
    attach: attach
  };

  function attach(context, settings) {
    $('.leaflet-widget').once().each(function(i, item) {
      var id = $(item).attr('id'),
        options = settings.leaflet_widget_widget[id];

      var map = L.map(id, options.map);

      L.tileLayer(options.map.base_url).addTo(map);

      // Get initial geojson value
      var current = $('#' + id + '-input').val();
      current = JSON.parse(current);
      var layers = Array();
      if (current.features.length) {
        var geojson = L.geoJson(current)
        for (var key in geojson._layers) {
          layers.push(geojson._layers[key]);
        }
      }

      var Items = new L.FeatureGroup(layers).addTo(map);

      // Autocenter if that's cool.
      if (options.map.auto_center) {
        if (current.features.length) {
          map.fitBounds(Items.getBounds());
        }
      }

      // Add controles to the map
      var drawControl = new L.Control.Draw({
        autocenter: true,
        draw: {
          position: 'topleft',
          polygon: options.draw.tools.polygon,
          circle: options.draw.tools.circle,
          marker: options.draw.tools.marker,
          rectangle: options.draw.tools.rectangle,
          polyline: options.draw.tools.polyline
        },
        edit: {
          featureGroup: Items
        }
      });

      map.addControl(drawControl);

      map.on('draw:created', function (e) {
        var type = e.layerTypee,
          layer = e.layer;
        // Remove already created layers. We only want to save one
        // per field.
        leafletWidgetLayerRemove(map._layers, Items);
        // Add new layer.
        Items.addLayer(layer);
      });

      $(item).parents('form').submit(function(event){
        if ($('#' + id + '-toggle').hasClass('map')) {
          leafletWidgetFormWrite(map._layers, id)
        }
      });

      Drupal.leaflet_widget[id] = map;

      if (options.toggle) {
        $('#' + id).before('<ul class="ui-tabs-nav leaflet-widget">' +
                           '<li><a href="#' + id + '">Map</a></li>' +
                           '<li><a href="#' + id + '-geojson' + '">GeoJSON</a></li>' +
                           '<li><a href="#' + id + '-points' + '">Points</a></li>' +
                           '</ul>');

        $('#' + id).after('<div id="' + id + '-geojson">' +
                          '<label for="' + id + '-geojson-textarea">' + Drupal.t('Enter GeoJSON:') + '</label>' +
                          '<textarea class="text-full form-control form-textarea" id="' + id + '-geojson-textarea" cols="60" rows="10"></textarea>' +
                          '</div>');

        // Set placeholder
        $('#' + id + '-geojson-textarea').attr('placeholder', JSON.stringify({"type":"FeatureCollection","features":[]}));

        // Update field's input when geojson input is updated.
        // @TODO validate before sync
        $('#' + id + '-geojson-textarea').on('input', function(e) {
          if(!$('#' + id + '-geojson-textarea').val()) {
            $('#' + id + '-input').val(JSON.stringify({"type":"FeatureCollection","features":[]}));
          } else {
            $('#' + id + '-input').val($('#' + id + '-geojson-textarea').val());
          }
        });

        $('#' + id).after('<div id="' + id + '-points" class="">' +
                          '<label for="' + id + '-points">' + Drupal.t('Point') + '</label>' +
                          '<input class="text-full form-control form-text" type="text" id="' + id + '-points-input" " placeholder="longitude,latitude" "size="60" maxlength="255">' +
                          '</div>');

        // Update field's input when geojson input is updated.
        $('#' + id + '-points-input').on('input', function(e) {
          var latlng = L.latLng($('#' + id + '-points-input').val().split(','));
          var coordinates = LatLngToCoords(latlng);
          var write = JSON.stringify(
            {"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"Point","coordinates":coordinates},"properties":[]}]}
          );
          $('#' + id + '-input').val(write);
        });

        // Set parent as JQuery UI element and update on selection
        $('#' + id).parent().tabs({
          // Default tab is the map tab.
          selected: 0,
          select: function(event, ui){
            switch(ui.index) {
              case 0:
                // Map tab is selected
                // Clear previous layers
                leafletWidgetLayerRemove(map._layers, Items);
              var current = $('#' + id + '-input').val();
              current = JSON.parse(current);
              if (current.features.length) {
                var geojson = L.geoJson(current)
                for (var key in geojson._layers) {
                  // Add new layer.
                  Items.addLayer(geojson._layers[key]);
                }
                map.fitBounds(Items.getBounds());
              }
              break;

              case 1:
                // GeoJSON tab is selected
                // Sync from field's input
                $('#' + id + '-geojson-textarea').val($('#' + id + '-input').val());
              break;

              case 2:
                // Points tab is selected
                // Reset value and error message and classes (if any).
                $('#' + id + '-points-input').val('');
                $('#' + id + '-points-input').parent().removeClass('has-error');
              $('#' + id + '-points-input').prop('disabled', false)
              .removeClass('error');
              $('#' + id + '-points .help-block').remove();

              var current = $('#' + id + '-input').val();
              current = JSON.parse(current);
              // Make this unavailable if more then single point.
              if (current.features.length == 0) {
                // Empty. Nothing to do
              } else if (current.features.length == 1
                  && current.features[0].geometry.type == 'Point') {
                    $('#' + id + '-points-input').val(current.features[0].geometry.coordinates.toString());
                  } else {
                    $('#' + id + '-points-input').parent().addClass('has-error');
                    $('#' + id + '-points-input').prop('disabled', true)
                    .addClass('error')
                    .after('<span class="help-block">Current data cannot be converted to a single point!</span>');
                  }
                  break;
            }
          }
        });
      }

      if (options.geographic_areas) {
        var json_data = {};
        var selectList = "<div class='geographic_areas_desc'><p></br>Select a state to add into the map:</p><select id='geographic_areas' name='area'>";
        selectList += "<option value='0'>" + Drupal.t('-none-') + "</option>";

        for (i = 0; i < options.areas.length; i++) {
          json_data = jQuery.parseJSON(options.areas[i]);
          $.each(json_data.features, function (index, item) {
            selectList += "<option value='" + item.id + "'>" + item.properties.name + "</option>";
          });
        }

        selectList += "</select></div></br>";
        $('#' + id + '-input').before(selectList);

        $('#geographic_areas').change(function() {
          var area = $(this).val();

          for (i = 0; i < options.areas.length; i++) {
            json_data = jQuery.parseJSON(options.areas[i]);
            $.each(json_data.features, function (index, item) {
              if (item.id == area) {
                L.geoJson(item).addTo(map);
                leafletWidgetFormWrite(map._layers, id);
              }
            });
          }
        });
      }
    });
  }

  /**
   * Writes layer to input field if there is a layer to write.
   */
  function leafletWidgetFormWrite(layers, id) {
    var write  = Array();
    for (var key in layers) {
      if (layers[key]._latlngs || layers[key]._latlng) {
        write.push(layerToGeometry(layers[key]));
      }
    }
    // If no value then provide empty collection.
    if (!write.length) {
      write = JSON.stringify({"type":"FeatureCollection","features":[]});
    }
    $('#' + id + '-input').val('{"type":"FeatureCollection", "features":[' + write + ']}');
  }

  /**
   * Removes layers that are already on the map.
   */
  function leafletWidgetLayerRemove(layers, Items) {
    for (var key in layers) {
      if (layers[key]._latlngs || layers[key]._latlng) {
        Items.removeLayer(layers[key]);
      }
    }
  }

  // This will all go away once this gets into leaflet main branch:
  // https://github.com/jfirebaugh/Leaflet/commit/4bc36d4c1926d7c68c966264f3cbf179089bd998
  var layerToGeometry = function(layer) {
    var json, type, latlng, latlngs = [], i;

    if (L.Marker && (layer instanceof L.Marker)) {
      type = 'Point';
      latlng = LatLngToCoords(layer._latlng);
      return JSON.stringify({"type": type, "coordinates": latlng});

    } else if (L.Polygon && (layer instanceof L.Polygon)) {
      type = 'Polygon';
      latlngs = LatLngsToCoords(layer._latlngs, 1);
      return JSON.stringify({"type": type, "coordinates": [latlngs]});

    } else if (L.Polyline && (layer instanceof L.Polyline)) {
      type = 'LineString';
      latlngs = LatLngsToCoords(layer._latlngs);
      return JSON.stringify({"type": type, "coordinates": latlngs});

    }
  }

  var LatLngToCoords = function (LatLng, reverse) { // (LatLng, Boolean) -> Array
    var lat = parseFloat(reverse ? LatLng.lng : LatLng.lat),
      lng = parseFloat(reverse ? LatLng.lat : LatLng.lng);

    return [lng,lat];
  }

  var LatLngsToCoords = function (LatLngs, levelsDeep, reverse) { // (LatLngs, Number, Boolean) -> Array
    var coord,
    coords = [],
      i, len;

    for (i = 0, len = LatLngs.length; i < len; i++) {
      coord = levelsDeep ?
        LatLngToCoords(LatLngs[i], levelsDeep - 1, reverse) :
        LatLngToCoords(LatLngs[i], reverse);
      coords.push(coord);
    }

    return coords;
  }

}(jQuery));
