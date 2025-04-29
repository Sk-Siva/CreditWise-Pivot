export const formatHeader = str =>
  str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const getUniqueKeys = (data, fields) => {
  const map = new Map();
  data.forEach(row => {
    const key = fields.map(f => row[f] ?? 'Total');
    const keyStr = key.join('|');
    map.set(keyStr, key);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.join('|').localeCompare(b.join('|'))
  );
};

const preprocessDateFields = (data, fields) => {
  return data.map(row => {
    const newRow = { ...row };

    fields.forEach(field => {
      const val = row[field];
      const date = new Date(val);

      if (val && !isNaN(date)) {
        newRow[`${field}_Year`] = date.getFullYear();
        newRow[`${field}_Month`] = date.getMonth() + 1; 
        newRow[`${field}_Day`] = date.getDate();
      }
    });

    return newRow;
  });
};

export const buildPivotData = (rawData, rowFields, colFields, valFields, aggregateFuncs = {}) => {
  const allFields = [...rowFields, ...colFields];
  const dateFields = [...new Set(allFields.map(f => f.split('_')[0]))]
    .filter(base => rawData[0]?.[base] && !rawData[0]?.[`${base}_Year`]);

  const processedData = preprocessDateFields(rawData, dateFields);

  const rowKeys = rowFields.length ? getUniqueKeys(processedData, rowFields) : [['Total']];
  const colKeys = colFields.length ? getUniqueKeys(processedData, colFields) : [['Total']];

  const pivot = {};
  const avgStore = {};
  const minStore = {};
  const maxStore = {};

  const cleanNumericValue = (value) => {
    if (typeof value === 'string') {
      const cleanedValue = value.replace(/[^0-9.-]+/g, '');
      return parseFloat(cleanedValue);
    }
    return parseFloat(value);
  };

  processedData.forEach(row => {
    const rowKey = rowFields.length ? rowFields.map(f => row[f] ?? 'Total') : ['Total'];
    const colKey = colFields.length ? colFields.map(f => row[f] ?? 'Total') : ['Total'];

    const rowStr = rowKey.join('|');
    const colStr = colKey.join('|');

    if (!pivot[rowStr]) pivot[rowStr] = {};
    if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};

    valFields.forEach(valField => {
      const aggFunc = aggregateFuncs[valField] || 'sum';
      const rawVal = row[valField];
      const value = cleanNumericValue(rawVal);
      const isValid = !isNaN(value);

      if (aggFunc === 'avg') {
        if (!avgStore[rowStr]) avgStore[rowStr] = {};
        if (!avgStore[rowStr][colStr]) avgStore[rowStr][colStr] = {};
        if (!avgStore[rowStr][colStr][valField]) avgStore[rowStr][colStr][valField] = [];

        if (isValid) {
          avgStore[rowStr][colStr][valField].push(value);
        }
      } else if (aggFunc === 'sum') {
        pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + (isValid ? value : 0);
      } else if (aggFunc === 'count') {
        pivot[rowStr][colStr][valField] = (pivot[rowStr][colStr][valField] || 0) + 1;
      } else if (aggFunc === 'min') {
        if (!minStore[rowStr]) minStore[rowStr] = {};
        if (!minStore[rowStr][colStr]) minStore[rowStr][colStr] = {};
        minStore[rowStr][colStr][valField] = Math.min(minStore[rowStr][colStr][valField] || value, value);
      } else if (aggFunc === 'max') {
        if (!maxStore[rowStr]) maxStore[rowStr] = {};
        if (!maxStore[rowStr][colStr]) maxStore[rowStr][colStr] = {};
        maxStore[rowStr][colStr][valField] = Math.max(maxStore[rowStr][colStr][valField] || value, value);
      }
    });
  });
//AVG
  for (const rowStr in avgStore) {
    for (const colStr in avgStore[rowStr]) {
      for (const valField in avgStore[rowStr][colStr]) {
        const values = avgStore[rowStr][colStr][valField];
        const sum = values.reduce((acc, v) => acc + v, 0);
        const avg = values.length > 0 ? sum / values.length : 0;

        if (!pivot[rowStr]) pivot[rowStr] = {};
        if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};
        pivot[rowStr][colStr][valField] = avg;
      }
    }
  }
//MIN
  for (const rowStr in minStore) {
    for (const colStr in minStore[rowStr]) {
      for (const valField in minStore[rowStr][colStr]) {
        pivot[rowStr][colStr][valField] = minStore[rowStr][colStr][valField];
      }
    }
  }
//MAX
  for (const rowStr in maxStore) {
    for (const colStr in maxStore[rowStr]) {
      for (const valField in maxStore[rowStr][colStr]) {
        pivot[rowStr][colStr][valField] = maxStore[rowStr][colStr][valField];
      }
    }
  }

  return { pivot, rowKeys, colKeys };
};