// install @types/geojson
import {Polygon} from 'geojson';

interface coordinates {
    lat: number | string;
    lng: number | string;
}

export default (topRight: coordinates, bottomLeft: coordinates): Polygon => {
    topRight.lat = Number(topRight.lat);
    topRight.lng = Number(topRight.lng);
    bottomLeft.lat = Number(bottomLeft.lat);
    bottomLeft.lng = Number(bottomLeft.lng);

    return {
        type: 'Polygon',
        coordinates: [
            [
                [bottomLeft.lng, bottomLeft.lat],
                [bottomLeft.lng, topRight.lat],
                [topRight.lng, topRight.lat],
                [topRight.lng, bottomLeft.lat],
                [bottomLeft.lng, bottomLeft.lat],
            ],
        ],
    };
};