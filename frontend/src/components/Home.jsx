import React, { useState, useEffect, useContext } from 'react';
import FileUploader from './FileUploader';
import RawCSVTable from './RawCSVTable';
import PivotConfigurator from './PivotConfigurator';
import PivotTable from './PivotTable';
import axios from "axios";
import UserContext from '../userContext';
import '../styles/styles.css';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();
  const [credits, setCredits] = useState(0);
  const [rawData, setRawData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [numericHeaders, setNumericHeaders] = useState([]);
  const [pivotConfig, setPivotConfig] = useState({
    rowFields: [],
    colFields: [],
    valFields: [],
    aggregateFuncs: {},
  });
  const [showPivotTable, setShowPivotTable] = useState(false);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/credits/balance/${userId}`);
        setCredits(response.data.current_credits || 0);
      } catch (error) {
        console.error('Error fetching credit balance:', error);
      }
    };
    if (userId) {
      fetchCredits();
    }
  }, [userId]);

  const handleBuy = () => navigate("/buy");

  useEffect(() => {
    if (rawData.length > 0 && headers.length > 0) {
      const isDate = (value) => {
        const parsed = Date.parse(value);
        return !isNaN(parsed) && isNaN(Number(value));
      };

      const numerics = headers.filter(header =>
        rawData.some(row => {
          const val = row[header];
          const num = parseFloat(val);
          return (
            val !== '' &&
            !isNaN(num) &&
            !isDate(val)
          );
        })
      );

      setNumericHeaders(numerics);
    }
  }, [rawData, headers]);

  const doAction = async (actionType, fieldsCount = 0) => {
    try {
      console.log(`fieldsCount ${fieldsCount}`);
      const response = await axios.post("http://localhost:5000/api/credits/use", {
        userId,
        actionName: actionType,
        fieldsCount
      });
      alert(response.data.message);
      setCredits(response.data.remaining || credits);
    } catch (error) {
      console.error('Error using credits:', error);
    }
  };

  const checkPivotVisibility = () => {
    const hiddenInput = document.getElementById('showPivotTable');
    if (hiddenInput) {
      setShowPivotTable(hiddenInput.value === "true");
    }
  };

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          checkPivotVisibility();
        }
      });
    });

    setTimeout(checkPivotVisibility, 100);

    const hiddenInput = document.getElementById('showPivotTable');
    if (hiddenInput) {
      observer.observe(hiddenInput, { attributes: true });
    }

    return () => {
      observer.disconnect();
    };
  }, [rawData, headers]);

  const { rowFields, colFields, valFields, aggregateFuncs } = pivotConfig;

  return (
    <div className="container">
      <div className="header-container">
        <h2>Welcome User!</h2>
        <div className="credit-display">
          <p><span className="credit-amount">🔥{credits}</span></p>
          <button className="button button-primary" onClick={handleBuy}>
            Buy Credits
          </button>
        </div>
      </div>
      
      <section className="file-uploader">
        <FileUploader setRawData={setRawData} setHeaders={setHeaders} credits={credits} doAction={doAction} />
      </section>

      {rawData.length > 0 && (
        <section>
          <h2 className="section-title">Raw CSV Data Preview</h2>
          <div className="raw-table-container">
            <RawCSVTable data={rawData} />
          </div>
        </section>
      )}

      {headers.length > 0 && (
        <section>
          <h2 className="section-title">Pivot Table Configuration</h2>
          <div className="pivot-container">
            <PivotConfigurator
              data={rawData}
              headers={headers}
              numericHeaders={numericHeaders}
              pivotConfig={pivotConfig}
              setPivotConfig={setPivotConfig}
              credits={credits}
              doAction={doAction}
            />
          </div>
        </section>
      )}

      {showPivotTable && (
        <section className="pivot-table-section">
          <h2 className="section-title">Pivot Table Results</h2>
          <div className="pivot-table-container">
            <PivotTable
              rawData={rawData}
              rowFields={rowFields}
              colFields={colFields}
              valFields={valFields}
              aggregateFuncs={aggregateFuncs}
              credits={credits}
              doAction={doAction}
            />
          </div>
        </section>
      )}
    </div>
  );
}

export default Home;