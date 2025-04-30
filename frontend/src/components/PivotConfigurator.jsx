import React, { useEffect, useMemo, useState } from 'react';
import '../styles/styles.css';

const PivotConfigurator = ({ headers = [], pivotConfig, setPivotConfig, data = [],credits, doAction }) => {
  const { rowFields = [], colFields = [], valFields = [], aggregateFuncs = {} } = pivotConfig;
  const [previousSelectedFields, setPreviousSelectedFields] = useState([]);
  const [showPivotTable, setShowPivotTable] = useState(false);

  const fieldValueMap = useMemo(() => {
    const map = {};
    headers.forEach(header => {
      map[header] = data.map(row => row[header]).filter(val => val !== undefined && val !== null);
    });
    return map;
  }, [headers, data]);

  const isNumericValue = (value) => {
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    const cleaned = String(value).replace(/[$€₹,]/g, '').trim();
    return !isNaN(parseFloat(cleaned));
  };

  const isNumericField = (field) => {
    const datePatterns = ['date', 'year', 'month', 'day'];
    if (datePatterns.some(p => field.toLowerCase().includes(p))) return false;
    const numericPatterns = [
      'price', 'amount', 'total', 'sum', 'value', 'cost',
      'quantity', 'percent', 'rate', 'ratio', 'salary', 'revenue'
    ];

    if (numericPatterns.some(p => field.toLowerCase().includes(p))) return true;

    const values = fieldValueMap[field] || [];
    return values.some(isNumericValue);
  };

  let allFields = [...new Set(headers)];
  if (headers.includes("Date")) {
    if (!allFields.includes("Date_Year")) allFields.push("Date_Year");
    if (!allFields.includes("Date_Month")) allFields.push("Date_Month");
    if (!allFields.includes("Date_Day")) allFields.push("Date_Day");
  }

  useEffect(() => {
    setPivotConfig(prev => {
      const updatedFuncs = { ...prev.aggregateFuncs };
      prev.valFields.forEach(field => {
        if (!updatedFuncs[field]) updatedFuncs[field] = 'sum';
      });
      return { ...prev, aggregateFuncs: updatedFuncs };
    });
  }, [valFields, setPivotConfig]);

  const handleDrop = (e, zone) => {
    const field = e.dataTransfer.getData('field');
    const isNumeric = isNumericField(field);

    if (zone === 'valFields' && !isNumeric) return;
    if ((zone === 'rowFields' || zone === 'colFields') && isNumeric) {
      return;
    }

    if (zone === 'rowFields' && colFields.includes(field)) {
      return;
    }
    if (zone === 'colFields' && rowFields.includes(field)) {
      return;
    }

    setPivotConfig(prev => {
      if (prev[zone].includes(field)) return prev;
      setShowPivotTable(false);
      return { ...prev, [zone]: [...prev[zone], field] };
    });
  };

  const removeField = (zone, field) => {
    setPivotConfig(prev => {
      setShowPivotTable(false);
      return {
        ...prev, 
        [zone]: prev[zone].filter(f => f !== field),
        aggregateFuncs: zone === 'valFields' ? { ...prev.aggregateFuncs, [field]: undefined } : prev.aggregateFuncs
      };
    });
  };

  const onDragStart = (e, field, type) => {
    e.dataTransfer.setData('field', field);
    e.dataTransfer.setData('type', isNumericField(field) ? 'numeric' : 'header');
    if (["Date_Year", "Date_Month", "Date_Day"].includes(field)) {
      e.dataTransfer.setData('isDerivedDate', 'true');
    }
  };

  const toggleField = (field) => {
    setPivotConfig(prev => {
      const isNumeric = isNumericField(field);
      setShowPivotTable(false);

      if (isNumeric && !prev.valFields.includes(field)) {
        return {
          ...prev,
          valFields: [...prev.valFields, field],
          aggregateFuncs: { ...prev.aggregateFuncs, [field]: 'sum' }
        };
      }

      if (!isNumeric && !prev.rowFields.includes(field) && !prev.colFields.includes(field)) {
        return {
          ...prev,
          rowFields: [...prev.rowFields, field],
        };
      }

      return {
        ...prev,
        rowFields: prev.rowFields.filter(f => f !== field),
        colFields: prev.colFields.filter(f => f !== field),
        valFields: prev.valFields.filter(f => f !== field),
        aggregateFuncs: { ...prev.aggregateFuncs, [field]: undefined }
      };
    });
  };

  const renderDropZone = (label, fieldKey, fields) => (
    <div className='drop-container'>
      <p>{label}</p>
      <div
        className={`drop-zone ${fieldKey}`}
        data-zone={fieldKey}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, fieldKey)}
      >
        {fields.map(field => (
          <div
            key={field}
            className="dropped-field"
            draggable
            onDragStart={(e) => onDragStart(e, field, isNumericField(field) ? 'numeric' : 'header')}
          >
            {fieldKey === 'valFields' && isNumericField(field) ? `∑ ${field}` : field}
            <button className="remove-btn" onClick={() => removeField(fieldKey, field)}>✖</button>
            {fieldKey === 'valFields' && isNumericField(field) && (
              <select
                className="agg-select"
                value={aggregateFuncs[field] || 'sum'}
                onChange={(e) => updateAggregateFunc(field, e.target.value)}
              >
                <option value="sum">SUM</option>
                <option value="avg">AVG</option>
                <option value="count">COUNT</option>
                <option value="min">MIN</option>
                <option value="max">MAX</option>
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const updateAggregateFunc = (field, func) => {
    setPivotConfig(prev => ({
      ...prev,
      aggregateFuncs: { ...prev.aggregateFuncs, [field]: func }
    }));
    setShowPivotTable(false);
  };

  const handleGenerateTable = () => {
    const allSelectedFields = [...new Set([...rowFields, ...colFields, ...valFields])];
    
    const newFields = allSelectedFields.filter(field => !previousSelectedFields.includes(field));
    if (credits < (newFields.length * 2)){
      alert ("Insufficient Credits ! Please Buy Credits to Continue")
      return;
    }
    if (newFields.length > 0) {
      doAction('select_field', newFields.length);
      setPreviousSelectedFields(allSelectedFields);
    }
    
    setShowPivotTable(true);
  };

  return (
    <div className="pivot-ui">
      <div className="fields-panel">
        <h3>PivotTable Fields</h3>
        <p className='para'>Choose Fields to add to report:</p>
        <div className="scrollable-fields">
          {allFields.map(field => {
            const isNumeric = isNumericField(field);
            const selected =
              rowFields.includes(field) || colFields.includes(field) || valFields.includes(field);

            return (
              <label
                key={field}
                className={`field-item ${isNumeric ? 'numeric' : ''}`}
                draggable
                onDragStart={(e) => onDragStart(e, field, isNumeric ? 'numeric' : 'header')}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleField(field)}
                />
                {isNumeric ? `∑ ${field}` : field}
              </label>
            );
          })}
        </div>
        <p className='para'>Drag Fields between areas below:</p>
      </div>

      <div className="dropzones-panel">
        {renderDropZone('Rows', 'rowFields', rowFields)}
        {renderDropZone('Columns', 'colFields', colFields)}
        {renderDropZone('Values', 'valFields', valFields)}
        
        <div className="generate-button-container">
          <button 
            className="button button-primary generate-button"
            onClick={handleGenerateTable}
            disabled={rowFields.length === 0 && colFields.length === 0 && valFields.length === 0}
          >
            Generate Pivot Table
          </button>
        </div>
      </div>
      
      <input type="hidden" value={showPivotTable ? "true" : "false"} id="showPivotTable" />
    </div>
  );
};

export default PivotConfigurator;