/**
 * Common food terms dictionary for typo correction
 * Used to correct misspellings when USDA returns no/few results
 */

export const COMMON_FOODS: string[] = [
  // Fruits
  'apple', 'apples', 'banana', 'bananas', 'orange', 'oranges', 'grape', 'grapes',
  'strawberry', 'strawberries', 'blueberry', 'blueberries', 'raspberry', 'raspberries',
  'blackberry', 'blackberries', 'mango', 'mangoes', 'pineapple', 'watermelon',
  'cantaloupe', 'honeydew', 'peach', 'peaches', 'pear', 'pears', 'plum', 'plums',
  'cherry', 'cherries', 'kiwi', 'papaya', 'coconut', 'lemon', 'lime', 'grapefruit',
  'tangerine', 'clementine', 'mandarin', 'pomegranate', 'fig', 'figs', 'date', 'dates',
  'apricot', 'apricots', 'nectarine', 'avocado', 'passion fruit', 'guava', 'lychee',
  'cranberry', 'cranberries', 'raisin', 'raisins', 'prune', 'prunes',
  
  // Vegetables
  'carrot', 'carrots', 'broccoli', 'spinach', 'kale', 'lettuce', 'cabbage',
  'cauliflower', 'celery', 'cucumber', 'tomato', 'tomatoes', 'potato', 'potatoes',
  'sweet potato', 'onion', 'onions', 'garlic', 'pepper', 'peppers', 'bell pepper',
  'jalapeno', 'zucchini', 'squash', 'pumpkin', 'eggplant', 'mushroom', 'mushrooms',
  'asparagus', 'artichoke', 'beet', 'beets', 'radish', 'turnip', 'parsnip',
  'corn', 'peas', 'green beans', 'brussels sprouts', 'bok choy', 'arugula',
  'romaine', 'iceberg', 'watercress', 'endive', 'leek', 'leeks', 'scallion',
  'shallot', 'chive', 'chives', 'ginger', 'turmeric', 'okra', 'collard greens',
  
  // Proteins - Meat
  'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'goose', 'veal',
  'bacon', 'ham', 'sausage', 'hot dog', 'salami', 'pepperoni', 'prosciutto',
  'steak', 'ribeye', 'sirloin', 'tenderloin', 'filet', 'brisket', 'roast',
  'ground beef', 'ground turkey', 'ground pork', 'ground chicken',
  'chicken breast', 'chicken thigh', 'chicken wing', 'chicken leg', 'drumstick',
  'pork chop', 'pork loin', 'pork belly', 'ribs', 'spare ribs',
  'meatball', 'meatballs', 'meatloaf', 'patty', 'burger',
  
  // Proteins - Seafood
  'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'scallops',
  'cod', 'tilapia', 'halibut', 'trout', 'sardine', 'sardines', 'anchovy',
  'anchovies', 'mackerel', 'herring', 'catfish', 'bass', 'snapper', 'grouper',
  'swordfish', 'mahi mahi', 'flounder', 'sole', 'perch', 'pike', 'walleye',
  'oyster', 'oysters', 'mussel', 'mussels', 'clam', 'clams', 'squid', 'calamari',
  'octopus', 'crawfish', 'crayfish', 'prawn', 'prawns',
  
  // Proteins - Other
  'egg', 'eggs', 'egg white', 'egg yolk', 'tofu', 'tempeh', 'seitan',
  'edamame', 'lentil', 'lentils', 'chickpea', 'chickpeas', 'black beans',
  'kidney beans', 'pinto beans', 'navy beans', 'white beans', 'lima beans',
  'soybeans', 'hummus', 'falafel',
  
  // Dairy
  'milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cream cheese',
  'cottage cheese', 'ricotta', 'mozzarella', 'cheddar', 'parmesan', 'swiss',
  'brie', 'gouda', 'feta', 'blue cheese', 'provolone', 'american cheese',
  'ice cream', 'gelato', 'frozen yogurt', 'whipped cream', 'half and half',
  'heavy cream', 'skim milk', 'whole milk', 'almond milk', 'oat milk', 'soy milk',
  'coconut milk', 'greek yogurt', 'kefir', 'ghee',
  
  // Grains & Carbs
  'rice', 'white rice', 'brown rice', 'wild rice', 'jasmine rice', 'basmati',
  'bread', 'whole wheat bread', 'white bread', 'sourdough', 'rye bread',
  'bagel', 'croissant', 'muffin', 'biscuit', 'roll', 'bun', 'pita', 'naan',
  'tortilla', 'wrap', 'flatbread', 'cornbread',
  'pasta', 'spaghetti', 'penne', 'linguine', 'fettuccine', 'rigatoni', 'macaroni',
  'lasagna', 'ravioli', 'gnocchi', 'noodle', 'noodles', 'ramen', 'udon', 'soba',
  'oatmeal', 'oats', 'cereal', 'granola', 'muesli', 'bran', 'wheat', 'barley',
  'quinoa', 'couscous', 'bulgur', 'farro', 'millet', 'buckwheat', 'polenta', 'grits',
  'pancake', 'pancakes', 'waffle', 'waffles', 'french toast', 'crepe', 'crepes',
  
  // Nuts & Seeds
  'almond', 'almonds', 'peanut', 'peanuts', 'walnut', 'walnuts', 'cashew', 'cashews',
  'pistachio', 'pistachios', 'pecan', 'pecans', 'hazelnut', 'hazelnuts',
  'macadamia', 'brazil nut', 'chestnut', 'chestnuts', 'pine nut', 'pine nuts',
  'sunflower seed', 'sunflower seeds', 'pumpkin seed', 'pumpkin seeds',
  'chia seed', 'chia seeds', 'flax seed', 'flaxseed', 'hemp seed', 'hemp seeds',
  'sesame seed', 'sesame seeds', 'poppy seed', 'poppy seeds',
  'peanut butter', 'almond butter', 'cashew butter', 'nutella', 'tahini',
  
  // Beverages
  'water', 'coffee', 'tea', 'juice', 'orange juice', 'apple juice', 'grape juice',
  'lemonade', 'soda', 'cola', 'coke', 'pepsi', 'sprite', 'ginger ale',
  'beer', 'wine', 'red wine', 'white wine', 'champagne', 'vodka', 'whiskey',
  'rum', 'gin', 'tequila', 'brandy', 'cocktail', 'margarita', 'mojito',
  'smoothie', 'milkshake', 'shake', 'protein shake', 'energy drink', 'sports drink',
  'hot chocolate', 'cocoa', 'espresso', 'latte', 'cappuccino', 'mocha',
  'iced tea', 'green tea', 'black tea', 'herbal tea', 'matcha',
  
  // Sweets & Desserts
  'cake', 'cupcake', 'brownie', 'cookie', 'cookies', 'pie', 'tart', 'pastry',
  'donut', 'doughnut', 'churro', 'eclair', 'macaron', 'meringue',
  'chocolate', 'candy', 'caramel', 'fudge', 'truffle', 'praline',
  'pudding', 'mousse', 'custard', 'flan', 'cheesecake', 'tiramisu', 'baklava',
  'sugar', 'honey', 'maple syrup', 'molasses', 'agave', 'stevia',
  'jam', 'jelly', 'marmalade', 'preserves',
  
  // Condiments & Sauces
  'ketchup', 'mustard', 'mayonnaise', 'mayo', 'relish', 'pickle', 'pickles',
  'salsa', 'guacamole', 'hot sauce', 'sriracha', 'tabasco', 'soy sauce',
  'teriyaki', 'worcestershire', 'vinegar', 'balsamic', 'olive oil', 'vegetable oil',
  'coconut oil', 'sesame oil', 'ranch', 'blue cheese dressing', 'italian dressing',
  'caesar dressing', 'vinaigrette', 'bbq sauce', 'barbecue sauce',
  'marinara', 'alfredo', 'pesto', 'salad dressing', 'gravy',
  
  // Snacks
  'chips', 'potato chips', 'tortilla chips', 'pretzels', 'popcorn', 'crackers',
  'trail mix', 'granola bar', 'protein bar', 'energy bar', 'fruit snacks',
  'jerky', 'beef jerky', 'dried fruit', 'fruit leather',
  
  // Fast Food & Prepared
  'pizza', 'burger', 'hamburger', 'cheeseburger', 'hot dog', 'sandwich', 'sub',
  'wrap', 'burrito', 'taco', 'tacos', 'quesadilla', 'nachos', 'enchilada',
  'fries', 'french fries', 'onion rings', 'chicken nuggets', 'chicken tenders',
  'fried chicken', 'chicken sandwich', 'fish and chips', 'fish sandwich',
  'gyro', 'shawarma', 'kebab', 'falafel wrap', 'spring roll', 'egg roll',
  'dumpling', 'dumplings', 'dim sum', 'wonton', 'sushi', 'sashimi', 'roll',
  'california roll', 'tempura', 'teriyaki chicken', 'pad thai', 'fried rice',
  'lo mein', 'chow mein', 'curry', 'tikka masala', 'butter chicken',
  'biryani', 'samosa', 'naan bread',
  
  // Soups & Salads
  'soup', 'chicken soup', 'tomato soup', 'vegetable soup', 'minestrone',
  'clam chowder', 'chili', 'stew', 'beef stew', 'gumbo', 'bisque',
  'salad', 'caesar salad', 'greek salad', 'garden salad', 'cobb salad',
  'coleslaw', 'potato salad', 'pasta salad', 'fruit salad',
  
  // Breakfast
  'bacon', 'sausage', 'hash browns', 'home fries', 'omelet', 'omelette',
  'scrambled eggs', 'fried egg', 'poached egg', 'eggs benedict',
  'breakfast burrito', 'breakfast sandwich', 'toast', 'english muffin',
  'danish', 'cinnamon roll', 'breakfast cereal', 'fruit cup',
  
  // Herbs & Spices
  'salt', 'pepper', 'black pepper', 'paprika', 'cumin', 'oregano', 'basil',
  'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'mint', 'sage',
  'cinnamon', 'nutmeg', 'cloves', 'allspice', 'cardamom', 'coriander',
  'cayenne', 'chili powder', 'curry powder', 'garam masala', 'za atar',
  
  // Miscellaneous
  'flour', 'baking powder', 'baking soda', 'yeast', 'cornstarch',
  'gelatin', 'vanilla', 'vanilla extract', 'cocoa powder', 'chocolate chips',
  'coconut flakes', 'shredded coconut', 'protein powder', 'whey protein',
  'nutritional yeast', 'miso', 'tofu', 'tempeh', 'jackfruit',
  'seaweed', 'nori', 'kelp', 'spirulina',
];

// Create a Set for faster lookups
export const COMMON_FOODS_SET = new Set(COMMON_FOODS.map(f => f.toLowerCase()));
