import { Chance } from 'chance';

const chance = new Chance();
const randomDate = (start, end) => {
  const today = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  const dd = today.getDate();
  const mm = today.getMonth() + 1;
  const yyyy = today.getFullYear();
  return `${yyyy}-${mm < 10 ? `0${mm}` : mm}-${dd < 10 ? `0${dd}` : dd}`;
};

const range = (len) => {
  const arr = [];
  for (let i = 0; i < len; i += 1) {
    arr.push(i);
  }
  return arr;
};

// Create our number formatter.
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',

  // These options are needed to round to whole numbers if that's what you want.
  // minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
  maximumFractionDigits: 0 // (causes 2500.99 to be printed as $2,501)
});

const newPerson = () => {
  const name = chance.name();
  let position = chance.profession();

  const office = chance.city();

  return {
    name,
    position,
    office,
    phone: `+9${Math.floor(Math.random() * 9 + 1)} ${chance.integer({ min: 111, max: 999 })}-${chance.integer({
      min: 111111,
      max: 999999
    })}`,
    startdate: randomDate(new Date(2012, 0, 1), new Date()),
    age: Math.floor(Math.random() * 60 + 18),
    salary: formatter.format(Math.floor(Math.random() * 60 + 100000))
  };
};

export const makeData = (lens) => {
  const count = [lens];

  const makeDataLevel = (depth = 0) => {
    const len = count[depth];
    return range(len).map(() => ({
      ...newPerson(),
      subRows: count[depth + 1] ? makeDataLevel(depth + 1) : undefined
    }));
  };

  return makeDataLevel();
};

export const headerData = [
  {
    Header: 'NAME',
    accessor: 'name'
  },
  {
    Header: 'POSITION',
    accessor: 'position'
  },
  {
    Header: 'OFFICE',
    accessor: 'office'
  },
  {
    Header: 'AGE',
    accessor: 'age'
  },
  {
    Header: 'START DATE',
    accessor: 'startdate'
  },
  {
    Header: 'SALARY',
    accessor: 'salary'
  }
];
