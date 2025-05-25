// Determin if the page is currently loading or not
import { useState } from 'react';

const useLoading = (initialState = true) => {
    const [isLoading, setIsLoading] = useState(initialState);
    return [isLoading, setIsLoading];
};

export default useLoading;