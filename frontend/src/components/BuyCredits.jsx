import React, { useState, useEffect,useContext } from "react";
import {useNavigate} from "react-router-dom"
import UserContext from '../userContext';
import axios from "axios";
import "../styles/styles.css"

function BuyCredits() {
  const { userId } = useContext(UserContext);
  const navigate = useNavigate()
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/credits/plans`);
        setPlans(res.data || []);
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }
    };
    fetchPlans();
  }, []);

  const handleBuyCredit = async (planId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/credits/buy/`, { userId, planId });
      alert(res.data.message || "Credits added successfully!");
      navigate('/')
    } catch (err) {
      alert("Error buying credits");
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h2>Buy Credits</h2>
      <div className="plans-container">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <h3 className="plan-name">{plan.name}</h3>
            <p className="plan-credits">{plan.credits} credits</p>
            <p className="plan-price">${plan.price}</p>
            <button 
              className="button button-primary"
              onClick={() => handleBuyCredit(plan.id)}
            >
              Purchase
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuyCredits;