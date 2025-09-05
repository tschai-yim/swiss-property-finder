# Tutti Complete Query (DO NOT REMOVE THIS FILE)

Here is the most complete tutti query (API endpoint also needs special headers):

```
query SearchListingsMaxDetail($query: String, $constraints: ListingSearchConstraints, $category: ID, $first: Int!, $offset: Int!, $sort: ListingSortMode!, $direction: SortDirection!) {
  searchListingsByQuery(
    query: $query
    constraints: $constraints
    category: $category
  ) {
    listings(first: $first, offset: $offset, sort: $sort, direction: $direction) {
      totalCount
      edges {
        node {
          listingID
          title
          body
          address
          postcodeInformation {
            postcode
            locationName
            canton {
              shortName
              name
            }
          }
          coordinates {
            latitude
            longitude
          }
          properties {
            ... on ListingPropertyDescription {
              listingPropertyID
              label
              text
            }
          }
          timestamp
          formattedPrice
          formattedSource
          highlighted
          primaryCategory {
            categoryID
            label
          }
          sellerInfo {
            alias
            logo {
              rendition {
                src
              }
            }
            subscriptionInfo {
              subscriptionBadge {
                src(format: SVG)
              }
            }
          }
          images(first: 20) {
            rendition(width: 1920, height: 1080) {
              src
            }
          }
          thumbnail {
            normalRendition: rendition(width: 235, height: 167) {
              src
            }
            retinaRendition: rendition(width: 470, height: 334) {
              src
            }
          }
          seoInformation {
            deSlug: slug(language: DE)
            frSlug: slug(language: FR)
            itSlug: slug(language: IT)
          }
        }
      }
      placements {
        keyValues {
          key
          value
        }
        pageName
        pagePath
        positions {
          adUnitID
          mobile
          position
          positionType
        }
        afs {
          customChannelID
          styleID
          adUnits {
            adUnitID
            mobile
          }
        }
      }
    }
    galleryListings(first: 5) {
      listingID
      title
      body
      address
      formattedPrice
      thumbnail {
        retinaRendition: rendition(width: 470, height: 334) {
          src
        }
      }
      seoInformation {
        deSlug: slug(language: DE)
      }
    }
    filters {
      __typename
      ... on ListingsFilterDescription {
        name
        label
        disabled
      }
      ... on ListingMultiSelectFilter {
        options {
          value
          label
        }
        placeholder
        inline
        selectedOptions: values
      }
      ... on ListingLocationFilter {
        value {
          radius
          selectedLocalities {
            localityID
            name
            localityType
          }
        }
      }
      ... on ListingPricingFilter {
        pricingValue: value {
          min
          max
          freeOnly
        }
        minField {
          placeholder
        }
        maxField {
          placeholder
        }
      }
      ... on ListingSingleSelectFilter {
        options {
          value
          label
        }
        placeholder
        inline
        selectedOption: value
      }
      ... on ListingIntervalFilter {
        intervalType {
          __typename
          ... on ListingIntervalTypeText {
            minLimit
            maxLimit
          }
          ... on ListingIntervalTypeSlider {
            sliderStart: minLimit
            sliderEnd: maxLimit
          }
        }
        intervalValue: value {
          min
          max
        }
        step
        unit
        minField {
          placeholder
        }
        maxField {
          placeholder
        }
      }
    }
    suggestedCategories {
      categoryID
      label
      searchToken
      mainImage {
        rendition(width: 300) {
          src
        }
      }
      parent {
        categoryID
        label
      }
    }
    selectedCategory {
      categoryID
      label
      parent {
        categoryID
        label
        parent {
          categoryID
          label
          parent {
            categoryID
            label
          }
        }
      }
    }
    seoInformation {
      seoIndexable
      title
      deQuerySlug: querySlug(language: DE)
      frQuerySlug: querySlug(language: FR)
      itQuerySlug: querySlug(language: IT)
      linkSections {
        title
        links {
          label
          slug
          searchToken
        }
      }
    }
    searchToken
    query
  }
}
```

and the corresponding variables:

```
{
  "category": "realEstate",
  "constraints": {
    "intervals": [
      {
        "key": "realEstateSize",
        "max": 1000000,
        "min": 0
      },
      {
        "key": "realEstateRooms",
        "max": 15,
        "min": 4
      }
    ],
    "locations": [
      {
        "key": "location",
        "localities": [
          "geo-city-zurich"
        ],
        "radius": 25
      }
    ],
    "prices": [
      {
        "freeOnly": false,
        "key": "price",
        "max": 20000,
        "min": 1
      }
    ],
    "strings": [
      {
        "key": "listingType",
        "value": [
          "apartment",
          "house",
          "flatShare"
        ]
      },
      {
        "key": "priceType",
        "value": [
          "RENT"
        ]
      },
      {
        "key": "organic",
        "value": [
          "tutti"
        ]
      }
    ]
  },
  "direction": "DESCENDING",
  "first": 2,
  "offset": 0,
  "query": null,
  "sort": "TIMESTAMP"
}
```