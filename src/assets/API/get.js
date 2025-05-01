import axios from 'axios';
import { useEffect, useState } from 'react';
import {API_URL} from '/src/config'; // Import the API_URL constant


const get = () => {
    const [data, setData] = useState([]);
    useEffect(() => {
        axios
            .get(`${API_URL}/card`)
            .then((res) => { setData(res.data) })
            .catch((err) => { console.log(err)})
    }, []);

    return data
};

export default get;