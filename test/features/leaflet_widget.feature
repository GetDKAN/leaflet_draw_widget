Given Dataset
title | description
test dataset | this is a test dataset

As a user with the "authenticated user" role
When I edit "Test Dataset"
I should see "Select a state to add into the map"
When I select "Georgia" from "#geographic_areas"
And I click "edit-submit"
Then I should see "POLYGON ((-83.109191 35.00118" or Then I should see the geojson for "Georgia"

As a As a user with the "authenticated user" role
When I edit "Test Dataset"
And I click "Add Data Manually"
And I enter "invalid json" in ".geofield_wkt"
And I click "Submit"
Then I should see "Invalid Geojson"
