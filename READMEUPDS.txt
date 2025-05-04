// Millard 5-2-25 

Changes additions:

-removed the multer setup that only for local uploads
-setUp new cloud Storage uploading with cloudinary
    - added file in utility for cloudinaryConfig 
- new .env code for credentials of cloudinary

Cards:
    cardsRoutes: 
        - import the cloudinary config 
        -refactor the route put for uploading new image
        - Also now can reupload image and will replace/remove the oldImages in cloudStorage
        - added new Function for extracting and trimming public id for replace/remove
    CardsEdit:
        - changed the img src for fetched image from {api_url}/uploads/cardsImgs/${card.image} to {card.image}
        - now able to display the uploaded image 
    marker_data.js:
        -change the code for cards fetching from `${API_URL}/uploads/cardsImg/${card.image}` to `${card.image}`
        -now able to dispaly it in the map cards.


// Millard 5-3-25

    Archives:
    