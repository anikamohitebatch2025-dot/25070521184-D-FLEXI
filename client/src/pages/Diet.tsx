import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Apple,
  Dumbbell,
  Droplets,
  Scale,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  BookOpen,
  Zap,
  Info,
  ShieldCheck,
  Award,
  ArrowRight,
  TrendingUp,
  Heart,
  Utensils
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

// Dietary Protocols
interface DietProtocol {
  id: string;
  name: string;
  tagline: string;
  category: 'hypertrophy' | 'cut' | 'hybrid' | 'plant' | 'keto';
  icon: string;
  caloriesNote: string;
  macroRatio: { protein: number; carbs: number; fats: number };
  bestFor: string;
  description: string;
  keyStaples: string[];
  timingTips: string;
}

const DIET_PROTOCOLS: DietProtocol[] = [
  {
    id: 'hypertrophy-bulk',
    name: 'Lean Hypertrophy Protocol',
    tagline: 'Controlled surplus engineered for myofibrillar protein synthesis with minimal adipose gain.',
    category: 'hypertrophy',
    icon: '💪',
    caloriesNote: '+300 to +450 kcal surplus',
    macroRatio: { protein: 30, carbs: 50, fats: 20 },
    bestFor: 'Bodybuilding, strength athletes, and progressive overload phases',
    description: 'Prioritizes sustained glycogen saturation with complex carbohydrates to fuel high-volume lifting sessions, paired with 2.2g of protein per kg of bodyweight distributed every 3-4 hours.',
    keyStaples: ['Jasmine Rice & Sweet Potatoes', 'Boneless Chicken Breast & Flank Steak', 'Whole Eggs & Liquid Egg Whites', 'Oatmeal with Whey Isolate', 'Raw Almonds & Extra Virgin Olive Oil'],
    timingTips: 'Consume 40% of daily carbohydrates around the workout window (60m pre and immediately post-training).'
  },
  {
    id: 'aggressive-cut',
    name: 'Metabolic Shred & Fat Loss',
    tagline: 'High protein nitrogen-sparing deficit designed to preserve lean muscle while accelerating lipid oxidation.',
    category: 'cut',
    icon: '🔥',
    caloriesNote: '-400 to -500 kcal deficit',
    macroRatio: { protein: 40, carbs: 35, fats: 25 },
    bestFor: 'Contest prep, aggressive fat reduction, and muscle definition phases',
    description: 'Elevates protein intake to 2.4g-2.6g/kg to maximize the thermic effect of food (TEF) and preserve lean mass during energy restriction. High-volume cruciferous vegetables maintain fullness.',
    keyStaples: ['Atlantic Cod, White Fish & Tilapia', 'Turkey Breast (99% Lean)', 'Broccoli, Asparagus & Baby Spinach', 'Greek Yogurt 0% Fat', 'Avocado (measured portions)'],
    timingTips: 'Cluster remaining carbohydrates strictly around resistance training; utilize fasted morning walks for fat oxidation.'
  },
  {
    id: 'hybrid-athlete',
    name: 'Hybrid Athletic Performance',
    tagline: 'Dual-pathway energy systems support for high-intensity functional training, HYROX, and powerlifting.',
    category: 'hybrid',
    icon: '⚡',
    caloriesNote: 'Isocaloric / High Expenditure',
    macroRatio: { protein: 25, carbs: 55, fats: 20 },
    bestFor: 'CrossFitters, endurance runners, and multi-sport combat athletes',
    description: 'Optimizes liver and muscle glycogen replenishment. Emphasizes clean, bioavailable carbohydrate sources and electrolyte-rich hydrators to sustain lactate threshold pacing.',
    keyStaples: ['Quinoa & Cream of Rice', 'Salmon & Lean Grass-Fed Beef', 'Bananas, Blueberries & Dates', 'Pure Coconut Water', 'Pumpkin Seeds & Walnuts'],
    timingTips: 'Incorporate 30g of fast-acting cyclic dextrin or dextrose during training sessions exceeding 75 minutes.'
  },
  {
    id: 'plant-titan',
    name: 'Anabolic Plant-Powered Titan',
    tagline: 'Complete essential amino acid profiling through complementary vegan whole foods and microfiltered isolates.',
    category: 'plant',
    icon: '🌱',
    caloriesNote: 'Flexible / Clean Surplus',
    macroRatio: { protein: 30, carbs: 45, fats: 25 },
    bestFor: 'Vegan and plant-focused lifters seeking maximum strength without dairy or meat',
    description: 'Overcomes plant protein bioavailability challenges by combining leucine-dense pea, brown rice, and hemp sources with ancient grains, tempeh, and nutrient-dense edamame.',
    keyStaples: ['Organic Tempeh & Extra Firm Tofu', 'Red Lentils & Chickpea Pasta', 'Pea & Brown Rice Protein Isolate', 'Nutritional Yeast & Hemp Hearts', 'Chia Seeds & Tahini'],
    timingTips: 'Supplement with 3-5g free-form L-Leucine or vegan BCAAs to trigger mTOR kinase signaling identically to animal protein.'
  },
  {
    id: 'targeted-keto',
    name: 'Targeted Ketogenic Performance',
    tagline: 'Fat-adapted metabolic state with targeted glycogen spikes directly surrounding anaerobic barbell work.',
    category: 'keto',
    icon: '🥑',
    caloriesNote: 'Low Carb / High Healthy Fat',
    macroRatio: { protein: 30, carbs: 5, fats: 65 },
    bestFor: 'Fat-adapted athletes, mental focus, steady blood glucose, and inflammation reduction',
    description: 'Shifts primary fuel from blood glucose to ketone bodies (beta-hydroxybutyrate). Healthy monounsaturated and MCT fats maintain sustained energy without insulin spikes.',
    keyStaples: ['Wild Caught Salmon & Sardines', 'Grass-Fed Ribeye & Egg Yolks', 'Avocado & Macadamia Nuts', 'MCT Oil & Grass-Fed Butter', 'Zucchini & Leafy Greens'],
    timingTips: 'Take 15-20g of dextrose or pure honey 20 minutes prior to intense lifting to fuel glycolytic work without exiting ketosis for long.'
  }
];

// Meal Library
interface Recipe {
  id: string;
  title: string;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  prepTime: string;
  image: string;
  badge: string;
  ingredients: string[];
  instructions: string;
}

const RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    title: 'Anabolic Vanilla Cinnamon French Toast',
    mealType: 'Breakfast',
    calories: 460,
    proteinG: 48,
    carbsG: 52,
    fatsG: 6,
    prepTime: '12 min',
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=700&q=80',
    badge: 'High Protein / Low Fat',
    ingredients: [
      '4 slices thick-cut sourdough or brioche bread',
      '180ml 100% liquid egg whites',
      '1 scoop (30g) FLEXI Vanilla Whey Isolate',
      '60ml unsweetened almond milk',
      '1 tsp Ceylon cinnamon & splash vanilla extract',
      'Sugar-free maple syrup & 50g fresh blueberries'
    ],
    instructions: 'Whisk egg whites, whey isolate, almond milk, cinnamon, and vanilla until smooth. Submerge bread slices for 20 seconds each side. Sear on medium-hot nonstick skillet for 2-3 minutes per side until golden. Drizzle with zero-calorie syrup and top with fresh berries.'
  },
  {
    id: 'rec-2',
    title: 'Precision Salmon, Quinoa & Avocado Power Bowl',
    mealType: 'Lunch',
    calories: 620,
    proteinG: 45,
    carbsG: 48,
    fatsG: 26,
    prepTime: '18 min',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80',
    badge: 'Omega-3 / Performance',
    ingredients: [
      '180g wild Alaskan salmon fillet',
      '150g cooked tri-color quinoa',
      '1/2 medium ripe avocado (sliced)',
      '100g steamed broccoli florets & shredded carrots',
      '1 tbsp toasted sesame seeds',
      'Low-sodium soy sauce & fresh lemon juice dressing'
    ],
    instructions: 'Season salmon with coarse sea salt, cracked black pepper, and lemon zest. Pan-sear skin side down for 5 minutes, flip and cook for 3 more minutes. Base your bowl with warm quinoa, arrange steamed vegetables, sliced avocado, and top with crispy salmon. Garnish with sesame seeds.'
  },
  {
    id: 'rec-3',
    title: 'Charred Flank Steak & Jasmine Rice Monster Bowl',
    mealType: 'Dinner',
    calories: 680,
    proteinG: 56,
    carbsG: 68,
    fatsG: 18,
    prepTime: '20 min',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80',
    badge: 'Hypertrophy Gold Standard',
    ingredients: [
      '200g lean flank steak or sirloin',
      '200g steamed fragrant jasmine rice',
      '100g grilled asparagus spears',
      '1 tbsp chimichurri herb sauce (olive oil, parsley, garlic)',
      '1 pinch Himalayan pink salt'
    ],
    instructions: 'Bring steak to room temperature. Sear on high heat cast iron skillet for 3.5 minutes per side for medium-rare. Let rest 5 minutes, then slice thinly against the grain. Plate next to fluffy steamed jasmine rice and charred asparagus. Drizzle with chimichurri.'
  },
  {
    id: 'rec-4',
    title: 'Glutamine & Leucine Overnight Oats Jar',
    mealType: 'Breakfast',
    calories: 490,
    proteinG: 42,
    carbsG: 58,
    fatsG: 10,
    prepTime: '5 min prep (Overnight)',
    image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=700&q=80',
    badge: 'Convenient / Muscle Fuel',
    ingredients: [
      '60g rolled whole oats',
      '1 scoop Chocolate Peanut Butter Whey Isolate',
      '1 tbsp chia seeds',
      '150ml unsweetened oat milk or skim milk',
      '1 tbsp all-natural creamy peanut butter',
      '1/2 sliced banana'
    ],
    instructions: 'In a mason jar, stir together oats, whey protein, chia seeds, and milk until dissolved. Top with peanut butter and banana slices. Seal and refrigerate for at least 4 hours or overnight. Enjoy cold or microwave for 60 seconds.'
  },
  {
    id: 'rec-5',
    title: 'Post-Workout Honey & Berry Whey Sludge',
    mealType: 'Snack',
    calories: 310,
    proteinG: 38,
    carbsG: 34,
    fatsG: 3,
    prepTime: '3 min',
    image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=700&q=80',
    badge: 'Fast Glycogen Reload',
    ingredients: [
      '1.5 scoops (45g) Gourmet Chocolate Whey Isolate',
      '15g raw wildflower honey',
      '100g frozen dark cherries or blueberries',
      '2-3 tbsp cold water (for pudding consistency)'
    ],
    instructions: 'Combine protein powder in a bowl, slowly drizzling 2-3 tablespoons of cold water while stirring aggressively with a spoon until thick pudding consistency forms. Stir in raw honey and top with chilled berries.'
  },
  {
    id: 'rec-6',
    title: 'Plant Power Tempeh & Sweet Potato Buddha Bowl',
    mealType: 'Lunch',
    calories: 540,
    proteinG: 36,
    carbsG: 64,
    fatsG: 16,
    prepTime: '22 min',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=80',
    badge: '100% Plant-Based',
    ingredients: [
      '180g organic tempeh (cubed and marinated)',
      '180g roasted Japanese sweet potato cubes',
      '80g steamed edamame beans',
      '1 cup massaged kale and purple cabbage',
      '1.5 tbsp lemon-tahini turmeric drizzle'
    ],
    instructions: 'Bake marinated tempeh and sweet potato cubes at 200°C (400°F) for 20 minutes until crisp. Layer bowl with dressed kale, roasted sweet potato, high-protein edamame, and crispy tempeh. Drizzle with creamy tahini dressing.'
  }
];

export const Diet: React.FC = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Active protocol filter tab
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedProtocol, setSelectedProtocol] = useState<DietProtocol>(DIET_PROTOCOLS[0]);

  // Recipe meal type filter
  const [selectedMealType, setSelectedMealType] = useState<string>('All');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  // Interactive TDEE & Macro Calculator State
  const [calcGender, setCalcGender] = useState<'male' | 'female'>('male');
  const [calcAge, setCalcAge] = useState<number>(26);
  const [calcWeightKg, setCalcWeightKg] = useState<number>(78);
  const [calcHeightCm, setCalcHeightCm] = useState<number>(178);
  const [calcActivity, setCalcActivity] = useState<number>(1.55); // 1.2 = Sedentary, 1.375 = Light, 1.55 = Moderate, 1.725 = Very, 1.9 = Athlete
  const [calcGoal, setCalcGoal] = useState<'cut_aggressive' | 'cut_lean' | 'maintain' | 'bulk_lean' | 'bulk_mass'>('bulk_lean');
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [savingMealId, setSavingMealId] = useState<string | null>(null);

  // Mifflin-St Jeor Calculation
  const macroResults = useMemo(() => {
    // BMR formula:
    // Men: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
    // Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
    let bmr = (10 * calcWeightKg) + (6.25 * calcHeightCm) - (5 * calcAge);
    bmr += calcGender === 'male' ? 5 : -161;

    const tdee = Math.round(bmr * calcActivity);

    let calorieTarget = tdee;
    let goalLabel = 'Maintain Bodyweight & Athletic Energy';

    if (calcGoal === 'cut_aggressive') {
      calorieTarget = tdee - 500;
      goalLabel = 'Aggressive Fat Loss (-500 kcal)';
    } else if (calcGoal === 'cut_lean') {
      calorieTarget = tdee - 300;
      goalLabel = 'Lean Definition Cut (-300 kcal)';
    } else if (calcGoal === 'bulk_lean') {
      calorieTarget = tdee + 300;
      goalLabel = 'Lean Hypertrophy Muscle Bulk (+300 kcal)';
    } else if (calcGoal === 'bulk_mass') {
      calorieTarget = tdee + 500;
      goalLabel = 'Maximum Size & Strength (+500 kcal)';
    }

    // Protein: 2.2g per kg for bulking/maintenance, 2.4g per kg for cutting
    const proteinFactor = (calcGoal.includes('cut')) ? 2.4 : 2.2;
    const proteinG = Math.round(calcWeightKg * proteinFactor);
    const proteinCalories = proteinG * 4;

    // Fats: 22-25% of total calories
    const fatCalories = calorieTarget * 0.23;
    const fatsG = Math.round(fatCalories / 9);

    // Carbs: Remaining calories
    const carbCalories = Math.max(0, calorieTarget - proteinCalories - fatCalories);
    const carbsG = Math.round(carbCalories / 4);

    // Water target: ~40ml per kg + exercise offset
    const waterTargetMl = Math.round((calcWeightKg * 42) + (calcActivity > 1.5 ? 500 : 0));

    // Percentages
    const totalCal = (proteinG * 4) + (carbsG * 4) + (fatsG * 9);
    const proteinPct = Math.round((proteinG * 4 / totalCal) * 100);
    const carbsPct = Math.round((carbsG * 4 / totalCal) * 100);
    const fatsPct = Math.round((fatsG * 9 / totalCal) * 100);

    return {
      bmr: Math.round(bmr),
      tdee,
      calorieTarget,
      proteinG,
      carbsG,
      fatsG,
      waterTargetMl,
      proteinPct,
      carbsPct,
      fatsPct,
      goalLabel
    };
  }, [calcGender, calcAge, calcWeightKg, calcHeightCm, calcActivity, calcGoal]);

  // Handle Save Targets to Member Dashboard
  const handleApplyTargetsToDashboard = async () => {
    if (!user) {
      info('Please log in as a member to save nutrition targets to your dashboard.');
      navigate('/login?redirect=/diet');
      return;
    }

    setIsSavingTargets(true);
    try {
      await axios.put('/api/nutrition/targets', {
        targetCalories: macroResults.calorieTarget,
        targetProteinG: macroResults.proteinG,
        targetCarbsG: macroResults.carbsG,
        targetFatsG: macroResults.fatsG,
        waterTargetMl: macroResults.waterTargetMl,
        dietaryPreference: selectedProtocol.name.includes('Plant') ? 'Vegan' : (selectedProtocol.name.includes('Keto') ? 'Keto' : 'High Protein')
      }, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      success(`🎯 Macro targets saved! Daily target set to ${macroResults.calorieTarget} kcal & ${macroResults.proteinG}g Protein.`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to sync targets.');
    } finally {
      setIsSavingTargets(false);
    }
  };

  // Handle adding meal directly to food log
  const handleAddMealToLog = async (recipe: Recipe) => {
    if (!user) {
      info('Log in to add this meal directly to your daily food log.');
      navigate('/login?redirect=/diet');
      return;
    }

    setSavingMealId(recipe.id);
    try {
      await axios.post('/api/nutrition/meal', {
        newMeal: {
          mealType: recipe.mealType,
          title: recipe.title,
          calories: recipe.calories,
          proteinG: recipe.proteinG,
          carbsG: recipe.carbsG,
          fatsG: recipe.fatsG,
          notes: `Added from FLEXI Recipe Library (${recipe.prepTime})`
        }
      }, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      success(`🥗 "${recipe.title}" added to your today's nutrition diary!`);
    } catch (err: any) {
      error(err.response?.data?.message || 'Could not log meal.');
    } finally {
      setSavingMealId(null);
    }
  };

  const filteredProtocols = activeCategory === 'all'
    ? DIET_PROTOCOLS
    : DIET_PROTOCOLS.filter(p => p.category === activeCategory);

  const filteredRecipes = selectedMealType === 'All'
    ? RECIPES
    : RECIPES.filter(r => r.mealType === selectedMealType);

  return (
    <div className="bg-[#0b0b0c] text-neutral-100 min-h-screen">
      
      {/* 1. HERO BANNER */}
      <section className="relative py-24 sm:py-32 overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2000&q=80"
            alt="Sports Nutrition"
            className="w-full h-full object-cover object-center opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/80 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#ff6a00]/10 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Evidence-Based Sports Dietetics
            </div>
            
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-none">
              FUEL THE ENGINE. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6a00] via-[#ff8833] to-[#ffaa66]">
                MASTER YOUR PHYSIQUE.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-neutral-300 leading-relaxed font-light">
              Nutrition is 70% of your body composition equation. Whether you are aiming for myofibrillar hypertrophy, sub-10% body fat conditioning, or hybrid power endurance, our sports science protocols deliver exact macronutrient targets and delicious meal templates.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#macro-calculator"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-lg shadow-[#ff6a00]/25 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Flame className="w-5 h-5" />
                Calculate My Macros
              </a>
              <a
                href="#meal-library"
                className="px-6 py-3.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white font-heading text-lg font-black uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Utensils className="w-5 h-5 text-[#ff6a00]" />
                Explore Meal Library
              </a>
            </div>

            {/* Quick Stats */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-neutral-800/80">
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-[#ff6a00]">2.2g/kg</div>
                <div className="text-xs text-neutral-400 font-medium">Optimal Protein Intake</div>
              </div>
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-white">5 Protocols</div>
                <div className="text-xs text-neutral-400 font-medium">Customized Athletic Paths</div>
              </div>
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-white">100% Macro</div>
                <div className="text-xs text-neutral-400 font-medium">Accuracy & Verification</div>
              </div>
              <div>
                <div className="font-heading text-2xl sm:text-3xl font-black text-[#ff6a00]">Mifflin-St</div>
                <div className="text-xs text-neutral-400 font-medium">Clinical TDEE Engine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE TDEE & MACRO CALCULATOR */}
      <section id="macro-calculator" className="py-20 bg-neutral-950 border-b border-neutral-800 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-wider mb-3">
              <Scale className="w-3.5 h-3.5" />
              Metabolic Precision Engine
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Interactive TDEE & Macro Calculator
            </h2>
            <p className="mt-3 text-neutral-400 text-base">
              Calculate your Basal Metabolic Rate (BMR) and exact Total Daily Energy Expenditure (TDEE). Get custom protein, carb, and fat targets calibrated for your current athletic objective.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Controls */}
            <div className="lg:col-span-7 bg-[#161618] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <h3 className="font-heading text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2 border-b border-neutral-800 pb-3">
                <Flame className="w-5 h-5 text-[#ff6a00]" />
                1. Your Biometrics & Goals
              </h3>

              {/* Gender & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                    Biological Gender
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCalcGender('male')}
                      className={`py-2.5 px-3 rounded-lg text-sm font-bold border transition-all ${
                        calcGender === 'male'
                          ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md shadow-[#ff6a00]/25'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcGender('female')}
                      className={`py-2.5 px-3 rounded-lg text-sm font-bold border transition-all ${
                        calcGender === 'female'
                          ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md shadow-[#ff6a00]/25'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Age
                    </label>
                    <span className="text-sm font-bold text-[#ff6a00]">{calcAge} yrs</span>
                  </div>
                  <input
                    type="range"
                    min="16"
                    max="80"
                    value={calcAge}
                    onChange={(e) => setCalcAge(Number(e.target.value))}
                    className="w-full accent-[#ff6a00] bg-neutral-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                    <span>16</span>
                    <span>45</span>
                    <span>80</span>
                  </div>
                </div>
              </div>

              {/* Weight & Height */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Weight (kg)
                    </label>
                    <span className="text-sm font-bold text-[#ff6a00]">{calcWeightKg} kg ({(calcWeightKg * 2.20462).toFixed(1)} lbs)</span>
                  </div>
                  <input
                    type="range"
                    min="45"
                    max="140"
                    step="0.5"
                    value={calcWeightKg}
                    onChange={(e) => setCalcWeightKg(Number(e.target.value))}
                    className="w-full accent-[#ff6a00] bg-neutral-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                    <span>45kg</span>
                    <span>90kg</span>
                    <span>140kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                      Height (cm)
                    </label>
                    <span className="text-sm font-bold text-[#ff6a00]">{calcHeightCm} cm</span>
                  </div>
                  <input
                    type="range"
                    min="140"
                    max="215"
                    value={calcHeightCm}
                    onChange={(e) => setCalcHeightCm(Number(e.target.value))}
                    className="w-full accent-[#ff6a00] bg-neutral-800 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
                    <span>140cm</span>
                    <span>178cm</span>
                    <span>215cm</span>
                  </div>
                </div>
              </div>

              {/* Activity Level */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Training Frequency & Activity Multiplier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { label: 'Sedentary (Desk Job, little training)', value: 1.2 },
                    { label: 'Lightly Active (1-3 gym sessions/wk)', value: 1.375 },
                    { label: 'Moderately Active (3-5 intense sessions/wk)', value: 1.55 },
                    { label: 'Very Active (6-7 days heavy lifting/cardio)', value: 1.725 },
                    { label: 'Elite Athlete (2x training/day or manual labor)', value: 1.9 },
                  ].map((act) => (
                    <button
                      key={act.value}
                      type="button"
                      onClick={() => setCalcActivity(act.value)}
                      className={`text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        calcActivity === act.value
                          ? 'bg-[#ff6a00]/15 border-[#ff6a00] text-white shadow-sm'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                      }`}
                    >
                      <div className="font-bold">{act.label.split('(')[0]}</div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{act.label.includes('(') ? `(${act.label.split('(')[1]}` : ''}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Athletic Objective
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { key: 'cut_aggressive', label: 'Aggressive Cut', desc: '-500 kcal deficit', badge: 'Fast Fat Loss' },
                    { key: 'cut_lean', label: 'Lean Cut', desc: '-300 kcal deficit', badge: 'Muscle Sparing' },
                    { key: 'maintain', label: 'Recomp / Maintenance', desc: 'Isocaloric baseline', badge: 'Performance' },
                    { key: 'bulk_lean', label: 'Lean Bulk', desc: '+300 kcal surplus', badge: 'Hypertrophy' },
                    { key: 'bulk_mass', label: 'Mass Gain', desc: '+500 kcal surplus', badge: 'Maximum Size' },
                  ].map((g) => (
                    <button
                      key={g.key}
                      type="button"
                      onClick={() => setCalcGoal(g.key as any)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        calcGoal === g.key
                          ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md shadow-[#ff6a00]/25'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs uppercase">{g.label}</span>
                      </div>
                      <div className={`text-[11px] ${calcGoal === g.key ? 'text-white/80' : 'text-neutral-500'}`}>
                        {g.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Output Panel */}
            <div className="lg:col-span-5 bg-gradient-to-b from-[#1c1c1f] to-[#121214] border border-neutral-700 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#ff6a00]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-neutral-400 font-bold">Your Target Prescription</span>
                  <h3 className="font-heading text-2xl font-black uppercase text-white mt-0.5">
                    {macroResults.goalLabel}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#ff6a00]/20 border border-[#ff6a00]/40 flex items-center justify-center text-[#ff6a00]">
                  <Flame className="w-5 h-5" />
                </div>
              </div>

              {/* Main Calories Badge */}
              <div className="bg-black/50 border border-neutral-800 rounded-xl p-5 text-center">
                <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Recommended Daily Intake</span>
                <div className="font-heading text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[#ff6a00] my-1">
                  {macroResults.calorieTarget.toLocaleString()}
                  <span className="text-lg font-normal text-neutral-400 ml-1">kcal/day</span>
                </div>
                <div className="flex justify-center items-center gap-4 text-xs text-neutral-400 mt-2">
                  <span>BMR: <strong className="text-white">{macroResults.bmr}</strong> kcal</span>
                  <span>•</span>
                  <span>TDEE: <strong className="text-white">{macroResults.tdee}</strong> kcal</span>
                </div>
              </div>

              {/* Macronutrient Breakdown Cards */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Daily Macronutrient Targets
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {/* Protein */}
                  <div className="bg-[#ff6a00]/10 border border-[#ff6a00]/30 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#ff6a00]">Protein</span>
                    <div className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
                      {macroResults.proteinG}g
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                      {macroResults.proteinG * 4} kcal ({macroResults.proteinPct}%)
                    </div>
                  </div>

                  {/* Carbs */}
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Carbs</span>
                    <div className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
                      {macroResults.carbsG}g
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                      {macroResults.carbsG * 4} kcal ({macroResults.carbsPct}%)
                    </div>
                  </div>

                  {/* Fats */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Fats</span>
                    <div className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
                      {macroResults.fatsG}g
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5 font-medium">
                      {macroResults.fatsG * 9} kcal ({macroResults.fatsPct}%)
                    </div>
                  </div>
                </div>

                {/* Macro Ratio Visual Bar */}
                <div className="pt-2">
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-neutral-800">
                    <div
                      style={{ width: `${macroResults.proteinPct}%` }}
                      className="bg-[#ff6a00] h-full"
                      title={`Protein: ${macroResults.proteinPct}%`}
                    />
                    <div
                      style={{ width: `${macroResults.carbsPct}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Carbohydrates: ${macroResults.carbsPct}%`}
                    />
                    <div
                      style={{ width: `${macroResults.fatsPct}%` }}
                      className="bg-blue-500 h-full"
                      title={`Fats: ${macroResults.fatsPct}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mt-1.5 px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#ff6a00]" /> Protein ({macroResults.proteinPct}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Carbs ({macroResults.carbsPct}%)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Fats ({macroResults.fatsPct}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Water Target */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
                <div className="flex items-center gap-3">
                  <Droplets className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">Hydration Baseline</div>
                    <div className="text-[11px] text-cyan-300/70">Electrolyte & cellular volume balance</div>
                  </div>
                </div>
                <div className="font-heading text-xl font-black text-cyan-300">
                  {(macroResults.waterTargetMl / 1000).toFixed(1)} Liters <span className="text-xs font-normal">/ day</span>
                </div>
              </div>

              {/* CTA: Sync to Member Dashboard */}
              <button
                type="button"
                onClick={handleApplyTargetsToDashboard}
                disabled={isSavingTargets}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-lg shadow-[#ff6a00]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
              >
                {isSavingTargets ? (
                  <>Saving Targets...</>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Apply Targets to My Daily Nutrition Plan
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-neutral-500">
                Syncs directly to your Member Portal tracker and calibrates your live meal progress bars.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 3. ATHLETIC DIETARY PROTOCOLS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-wider mb-3">
              <Award className="w-3.5 h-3.5" />
              Specialized Frameworks
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              Athletic Nutrition Blueprints
            </h2>
            <p className="mt-2 text-neutral-400 max-w-2xl text-sm sm:text-base">
              Explore scientific protocols tailored for hypertrophy, rapid conditioning, functional athletics, and alternative lifestyles.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
            {[
              { id: 'all', label: 'All Frameworks' },
              { id: 'hypertrophy', label: 'Hypertrophy' },
              { id: 'cut', label: 'Metabolic Cut' },
              { id: 'hybrid', label: 'Hybrid Athlete' },
              { id: 'plant', label: 'Plant-Based' },
              { id: 'keto', label: 'Targeted Keto' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Protocols Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProtocols.map(proto => (
            <div
              key={proto.id}
              className={`bg-[#161618] border rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-[#ff6a00]/50 hover:shadow-xl hover:-translate-y-1 ${
                selectedProtocol.id === proto.id ? 'border-[#ff6a00] ring-1 ring-[#ff6a00]' : 'border-neutral-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{proto.icon}</span>
                  <span className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-[11px] font-bold">
                    {proto.caloriesNote}
                  </span>
                </div>

                <h3 className="font-heading text-2xl font-black uppercase text-white mb-2">
                  {proto.name}
                </h3>

                <p className="text-neutral-400 text-xs leading-relaxed mb-4">
                  {proto.tagline}
                </p>

                {/* Macro Ratio Badges */}
                <div className="flex items-center gap-2 mb-4 bg-neutral-900/80 p-2.5 rounded-xl border border-neutral-800 text-[11px]">
                  <span className="text-[#ff6a00] font-bold">{proto.macroRatio.protein}% P</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-emerald-400 font-bold">{proto.macroRatio.carbs}% C</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-blue-400 font-bold">{proto.macroRatio.fats}% F</span>
                </div>

                {/* Key Staples */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Core Staples:
                  </span>
                  <ul className="space-y-1 text-xs text-neutral-300">
                    {proto.keyStaples.slice(0, 3).map((staple, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#ff6a00] shrink-0" />
                        <span className="truncate">{staple}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 text-[11px] text-neutral-400 leading-snug mb-4">
                  <strong className="text-neutral-200">Timing Strategy:</strong> {proto.timingTips}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedProtocol(proto);
                  // scroll to calculator
                  const elem = document.getElementById('macro-calculator');
                  if (elem) elem.scrollIntoView({ behavior: 'smooth' });
                  info(`Selected protocol: ${proto.name}. Calibrated in Macro Engine!`);
                }}
                className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-[#ff6a00] hover:text-white border border-neutral-700 hover:border-[#ff6a00] text-neutral-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                Load Into Calculator
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. PERFORMANCE MEAL LIBRARY & CHEF RECIPES */}
      <section id="meal-library" className="py-20 bg-neutral-950 border-b border-neutral-800 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-wider mb-3">
                <Utensils className="w-3.5 h-3.5" />
                Performance Kitchen
              </div>
              <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Chef-Crafted Athletic Meals
              </h2>
              <p className="mt-2 text-neutral-400 max-w-2xl text-sm sm:text-base">
                Tested recipes with verifiable macro accuracy. Click to review detailed ingredients, culinary prep, and log directly to your member diet planner.
              </p>
            </div>

            {/* Meal Type Tabs */}
            <div className="flex flex-wrap gap-2 mt-6 md:mt-0">
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedMealType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                    selectedMealType === type
                      ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-md'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Recipes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes.map((recipe) => (
              <div
                key={recipe.id}
                className="bg-[#161618] border border-neutral-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#ff6a00]/50 transition-all hover:shadow-2xl"
              >
                <div>
                  {/* Photo Banner with Badges */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161618] via-transparent to-black/40" />

                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider border border-white/10">
                        {recipe.mealType}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-[#ff6a00]/90 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
                        {recipe.badge}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-xs text-neutral-300">
                      <Clock className="w-3.5 h-3.5 text-[#ff6a00]" />
                      <span>{recipe.prepTime}</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="font-heading text-xl font-black uppercase text-white leading-tight mb-4 group-hover:text-[#ff6a00] transition-colors">
                      {recipe.title}
                    </h3>

                    {/* Macros Bar */}
                    <div className="grid grid-cols-4 gap-2 bg-neutral-900/90 p-3 rounded-xl border border-neutral-800 text-center mb-5">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-neutral-400">Calories</div>
                        <div className="font-heading text-lg font-black text-white">{recipe.calories}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#ff6a00]">Protein</div>
                        <div className="font-heading text-lg font-black text-[#ff6a00]">{recipe.proteinG}g</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-400">Carbs</div>
                        <div className="font-heading text-lg font-black text-emerald-400">{recipe.carbsG}g</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-blue-400">Fats</div>
                        <div className="font-heading text-lg font-black text-blue-400">{recipe.fatsG}g</div>
                      </div>
                    </div>

                    {/* Recipe Instructions Toggle */}
                    <button
                      type="button"
                      onClick={() => setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id)}
                      className="text-xs font-bold text-neutral-300 hover:text-[#ff6a00] flex items-center gap-1.5 transition-colors mb-4"
                    >
                      <BookOpen className="w-4 h-4 text-[#ff6a00]" />
                      {expandedRecipeId === recipe.id ? 'Hide Preparation & Ingredients' : 'View Ingredients & Method'}
                    </button>

                    {expandedRecipeId === recipe.id && (
                      <div className="space-y-3 pt-3 border-t border-neutral-800 text-xs animate-fadeIn">
                        <div>
                          <strong className="text-white uppercase tracking-wider text-[11px] block mb-1.5">
                            Ingredients:
                          </strong>
                          <ul className="space-y-1 text-neutral-400 list-disc list-inside">
                            {recipe.ingredients.map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-white uppercase tracking-wider text-[11px] block mb-1.5">
                            Preparation Method:
                          </strong>
                          <p className="text-neutral-400 leading-relaxed bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                            {recipe.instructions}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => handleAddMealToLog(recipe)}
                    disabled={savingMealId === recipe.id}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-[#ff6a00] hover:to-[#e05500] hover:text-white border border-neutral-700 hover:border-[#ff6a00] text-neutral-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {savingMealId === recipe.id ? (
                      <>Adding to Log...</>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add to Today's Food Log
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. EVIDENCE-BASED SUPPLEMENT & HYDRATION GUIDE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tier-1 Ergogenic Aids
          </div>
          <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            Evidence-Based Supplement Stack
          </h2>
          <p className="mt-3 text-neutral-400 text-sm sm:text-base">
            No proprietary blends or snake oil. Only compounds with meta-analytic support in the International Society of Sports Nutrition (ISSN) literature.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Creatine Monohydrate',
              badge: 'Tier 1 Essential',
              dosage: '5g daily (Consistent timing)',
              mechanism: 'Phosphocreatine Resynthesis',
              description: 'Replenishes cellular ATP during high-intensity 1-10 second anaerobic exertions. Increases intracellular water retention, power output by 8-14%, and lean mass accrual.',
              timing: 'Post-workout with carbohydrates, or once daily with any meal.'
            },
            {
              title: 'Whey Protein Isolate',
              badge: 'Fast-Acting Leucine',
              dosage: '25g - 40g (1-2 scoops)',
              mechanism: 'mTOR Kinase Activation',
              description: 'Provides ~3g of leucine per serving, surpassing the threshold required to maximize Muscle Protein Synthesis (MPS). High biological value and ultra-rapid gastrointestinal transit.',
              timing: 'Within 60-90 minutes post-training or between meals.'
            },
            {
              title: 'Electrolyte Mineral Complex',
              badge: 'Neuromuscular Drive',
              dosage: '500mg Na+ / 200mg K+ / 60mg Mg2+',
              mechanism: 'Action Potential Conduction',
              description: 'Maintains osmotic pressure and prevents motor unit fatigue. Intense heavy sweating depletes sodium, reducing involuntary muscle contractions and vascular pump.',
              timing: 'Dissolved in water bottle during intense resistance sessions.'
            },
            {
              title: 'Omega-3 (High EPA & DHA)',
              badge: 'Anti-Inflammatory',
              dosage: '2000mg total (min 1000mg EPA)',
              mechanism: 'Cell Membrane Fluidity',
              description: 'Reduces delayed onset muscle soreness (DOMS), supports heart health, optimizes blood pressure, and sensitizes muscle tissue to amino acid uptake.',
              timing: 'Taken with breakfast or dinner containing healthy fats.'
            },
            {
              title: 'Caffeine Anhydrous',
              badge: 'Central Nervous System',
              dosage: '3 - 5mg per kg of bodyweight',
              mechanism: 'Adenosine Receptor Antagonism',
              description: 'Lowers Rate of Perceived Exertion (RPE), increases motor unit recruitment, enhances alertness, and blunts pain threshold during heavy sets.',
              timing: '30-45 minutes pre-workout. Avoid within 7 hours of bedtime.'
            },
            {
              title: 'Beta-Alanine',
              badge: 'Lactate Buffering',
              dosage: '3.2g - 6.4g daily',
              mechanism: 'Intramuscular Carnosine Booster',
              description: 'Buffers hydrogen ion (H+) accumulation in working muscles, delaying neuromuscular fatigue during repetitions and sprints lasting 60-240 seconds.',
              timing: 'Split into two daily doses to minimize paresthesia (harmless tingling).'
            }
          ].map((supp, idx) => (
            <div
              key={idx}
              className="bg-[#161618] border border-neutral-800 rounded-2xl p-6 hover:border-[#ff6a00]/40 transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-md bg-[#ff6a00]/15 border border-[#ff6a00]/30 text-[#ff6a00] text-[10px] font-bold uppercase tracking-wider">
                    {supp.badge}
                  </span>
                  <h3 className="font-heading text-xl font-bold uppercase text-white mt-2">
                    {supp.title}
                  </h3>
                </div>
              </div>

              <div className="text-xs text-neutral-300 leading-relaxed">
                {supp.description}
              </div>

              <div className="pt-3 border-t border-neutral-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="font-bold text-neutral-300">Target Dose:</span>
                  <span className="text-[#ff6a00] font-semibold">{supp.dosage}</span>
                </div>
                <div className="flex justify-between items-center text-neutral-400">
                  <span className="font-bold text-neutral-300">Mechanism:</span>
                  <span className="text-neutral-200">{supp.mechanism}</span>
                </div>
                <div className="p-2.5 bg-neutral-900 rounded-lg text-[11px] text-neutral-400">
                  <strong className="text-white">Timing:</strong> {supp.timing}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. SPORTS NUTRITION PRINCIPLES & FAQ */}
      <section className="py-20 bg-neutral-950 border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
              The Science of Athletic Fueling
            </h2>
            <p className="mt-2 text-neutral-400 text-sm">
              Critical nutritional guidelines every serious trainee must understand.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'How much protein can the body absorb in one meal?',
                a: 'The myth that you can only absorb 30g per meal has been debunked. While 30-40g of high-quality protein with ~3g leucine maximizes the immediate muscle protein synthesis (MPS) spike, extra protein is still digested, absorbed, and utilized for systemic structural tissues and gut health. Spacing meals every 3-4 hours provides multiple MPS stimulation triggers throughout the day.'
              },
              {
                q: 'Should I eat carbohydrates before or after my workout?',
                a: 'Both are critical. 60-90 minutes pre-workout, consume easily digestible carbohydrates (e.g. oats, bananas, white rice) to top off liver and muscle glycogen. Post-workout, high-glycemic carbohydrates combined with protein speed up glycogen synthase enzyme activity and halt exercise-induced catabolism.'
              },
              {
                q: 'How much water should I drink during heavy training?',
                a: 'A 2% drop in bodyweight from dehydration leads to a 10-15% reduction in 1-rep max strength and elevated heart rates. We recommend 500ml upon waking, 500ml 1 hour before lifting, and 150-200ml every 15-20 minutes during vigorous training with trace electrolytes.'
              },
              {
                q: 'Can I build muscle and lose fat at the same time (Body Recomposition)?',
                a: 'Yes, especially if you are relatively new to structured lifting, returning from a layoff, or possess a body fat percentage above 15% (men) / 23% (women). By eating at a slight deficit (-200 to -300 kcal) with high protein (2.4g/kg) and progressive overload training, your body will oxidize stored fat to fuel muscle growth.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-[#161618] border border-neutral-800 rounded-xl p-5 sm:p-6">
                <h4 className="font-heading text-lg font-bold text-white uppercase tracking-wide flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#ff6a00] shrink-0" />
                  {faq.q}
                </h4>
                <p className="mt-2 text-neutral-400 text-sm leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff6a00] text-xs font-bold uppercase tracking-widest mb-4">
            <Heart className="w-3.5 h-3.5" />
            Transform Your Nutrition Today
          </div>
          <h2 className="font-heading text-4xl sm:text-6xl font-black uppercase text-white max-w-3xl mx-auto leading-none">
            PAIR YOUR TRAINING WITH ELITE NUTRITION COACHING
          </h2>
          <p className="mt-4 text-neutral-400 max-w-xl mx-auto text-base">
            Work 1-on-1 with our certified sports nutritionists, receive custom grocery checklists, and track every gram inside your FLEXI Member Dashboard.
          </p>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-xl shadow-[#ff6a00]/25 transition-all hover:scale-105"
              >
                Go to My Member Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#ff6a00] to-[#e05500] hover:from-[#ff7b1a] hover:to-[#eb6009] text-white font-heading text-lg font-black uppercase tracking-wider shadow-xl shadow-[#ff6a00]/25 transition-all hover:scale-105"
                >
                  Join FLEXI Today
                </Link>
                <Link
                  to="/book"
                  className="px-8 py-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-heading text-lg font-black uppercase tracking-wider transition-all"
                >
                  Book Nutrition Consultation
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
export default Diet;
