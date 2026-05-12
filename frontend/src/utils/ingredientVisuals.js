import avocado from '../assets/ingredients/avocado.svg';
import beef from '../assets/ingredients/beef.svg';
import broccoli from '../assets/ingredients/broccoli.svg';
import brownRice from '../assets/ingredients/brown-rice.svg';
import chicken from '../assets/ingredients/chicken.svg';
import cucumber from '../assets/ingredients/cucumber.svg';
import egg from '../assets/ingredients/egg.svg';
import fallback from '../assets/ingredients/fallback.svg';
import lettuce from '../assets/ingredients/lettuce.svg';
import mushroom from '../assets/ingredients/mushroom.svg';
import pasta from '../assets/ingredients/pasta.svg';
import quinoa from '../assets/ingredients/quinoa.svg';
import salmon from '../assets/ingredients/salmon.svg';
import shrimp from '../assets/ingredients/shrimp.svg';
import sweetPotato from '../assets/ingredients/sweet-potato.svg';
import tofu from '../assets/ingredients/tofu.svg';
import tomato from '../assets/ingredients/tomato.svg';

const ingredientVisuals = [
  { keys: ['chicken'], image: chicken, accent: '#f59e0b', model: 'chicken' },
  { keys: ['lettuce', 'greens'], image: lettuce, accent: '#22c55e', model: 'leaf' },
  { keys: ['salmon'], image: salmon, accent: '#fb7185', model: 'fillet' },
  { keys: ['tofu'], image: tofu, accent: '#eab308', model: 'cube' },
  { keys: ['quinoa'], image: quinoa, accent: '#d6a84d', model: 'grain' },
  { keys: ['brown rice', 'rice'], image: brownRice, accent: '#b45309', model: 'grain' },
  { keys: ['avocado'], image: avocado, accent: '#65a30d', model: 'avocado' },
  { keys: ['broccoli'], image: broccoli, accent: '#16a34a', model: 'broccoli' },
  { keys: ['shrimp'], image: shrimp, accent: '#f97316', model: 'shrimp' },
  { keys: ['sweet potato'], image: sweetPotato, accent: '#ea580c', model: 'tuber' },
  { keys: ['tomato'], image: tomato, accent: '#ef4444', model: 'sphere' },
  { keys: ['mushroom'], image: mushroom, accent: '#a16207', model: 'mushroom' },
  { keys: ['cucumber'], image: cucumber, accent: '#15803d', model: 'cylinder' },
  { keys: ['egg'], image: egg, accent: '#f59e0b', model: 'egg' },
  { keys: ['beef'], image: beef, accent: '#991b1b', model: 'fillet' },
  { keys: ['pasta'], image: pasta, accent: '#eab308', model: 'noodle' },
];

export const getIngredientVisual = (ingredient) => {
  const name = ingredient.name?.toLowerCase() || '';
  const visual = ingredientVisuals.find((item) =>
    item.keys.some((key) => name.includes(key))
  );
  return visual || { image: fallback, accent: '#0f766e', model: 'sphere' };
};
