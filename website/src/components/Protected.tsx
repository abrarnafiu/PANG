import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Protected: React.FC = () => {
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProtected = async () => {
            try {
                const response = await api.get('/protected', {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                });
                setMessage(response.data.message);
            } catch (error) {
                alert("Unauthorized");
            }
        };

        fetchProtected();
    }, []);

    return (
        <div>
            <h1>Protected Route</h1>
            <p>{message}</p>
        </div>
    );
};

export default Protected;
