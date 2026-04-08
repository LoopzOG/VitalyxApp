export const EXERCISE_CATEGORIES = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Glutes",
  "Hamstrings",
  "Quads",
  "Calves",
  "Core / Abs",
  "Full Body",
  "Cardio",
  "Mobility / Functional",
] as const;

export const EQUIPMENT_TAGS = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Smith Machine",
  "Bodyweight",
  "Kettlebell",
  "Resistance Band",
  "EZ Bar",
  "Trap Bar",
  "Medicine Ball",
  "Cardio Machine",
  "Treadmill",
  "Bike",
  "Stair Climber",
  "Rowing Machine",
  "Sled",
  "None",
] as const;

export type ExerciseCategory = (typeof EXERCISE_CATEGORIES)[number];
export type EquipmentTag = (typeof EQUIPMENT_TAGS)[number];
export type ExerciseDifficulty = "Beginner" | "Intermediate" | "Advanced";
export type ExerciseTab = "all" | "strength" | "cardio";

export type ExerciseRecord = {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: EquipmentTag[];
  movementPattern: string;
  difficulty: ExerciseDifficulty;
  isCardio: boolean;
  instructions: string[];
  aliases: string[];
  calorieEstimatePerMinute?: number;
  isDistanceBased?: boolean;
  isStepBased?: boolean;
  isPopular?: boolean;
};

export type CardioQuickPreset = {
  id: string;
  label: string;
  durationMinutes?: number;
  miles?: number;
  steps?: number;
};

type ExerciseSeed = Omit<ExerciseRecord, "id" | "instructions"> & {
  id?: string;
  instructions?: string[];
};

function toId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createInstructions(name: string, movementPattern: string, primaryMuscle: string) {
  return [
    `Set up for ${name.toLowerCase()} with a stable brace and controlled starting position.`,
    `Move through the ${movementPattern.toLowerCase()} while keeping tension on the ${primaryMuscle.toLowerCase()}.`,
    "Finish each rep under control and stop the set when technique starts to break down.",
  ];
}

function createExercise(seed: ExerciseSeed): ExerciseRecord {
  return {
    ...seed,
    id: seed.id ?? toId(seed.name),
    instructions: seed.instructions ?? createInstructions(seed.name, seed.movementPattern, seed.primaryMuscle),
  };
}

const chestExercises: ExerciseSeed[] = [
  { name: "Barbell Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["bench", "bench press", "barbell bench"], isPopular: true },
  { name: "Incline Barbell Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: ["Barbell"], movementPattern: "Incline Push", difficulty: "Intermediate", isCardio: false, aliases: ["incline bench", "incline barbell press"], isPopular: true },
  { name: "Decline Barbell Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Barbell"], movementPattern: "Decline Push", difficulty: "Intermediate", isCardio: false, aliases: ["decline bench", "decline press"] },
  { name: "Dumbbell Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Dumbbell"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["db bench", "dumbbell press"], isPopular: true },
  { name: "Incline Dumbbell Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: ["Dumbbell"], movementPattern: "Incline Push", difficulty: "Intermediate", isCardio: false, aliases: ["incline db press", "incline dumbbell bench"], isPopular: true },
  { name: "Decline Dumbbell Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Dumbbell"], movementPattern: "Decline Push", difficulty: "Intermediate", isCardio: false, aliases: ["decline db press"] },
  { name: "Flat Dumbbell Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Dumbbell"], movementPattern: "Chest Fly", difficulty: "Intermediate", isCardio: false, aliases: ["dumbbell fly", "db fly"] },
  { name: "Incline Dumbbell Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Dumbbell"], movementPattern: "Incline Fly", difficulty: "Intermediate", isCardio: false, aliases: ["incline fly"] },
  { name: "Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Cable"], movementPattern: "Chest Fly", difficulty: "Beginner", isCardio: false, aliases: ["cable crossover", "fly"], isPopular: true },
  { name: "Low-to-High Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Cable"], movementPattern: "Upper Chest Fly", difficulty: "Beginner", isCardio: false, aliases: ["low high fly", "upper chest cable fly"] },
  { name: "High-to-Low Cable Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Cable"], movementPattern: "Lower Chest Fly", difficulty: "Beginner", isCardio: false, aliases: ["high low fly", "lower chest cable fly"] },
  { name: "Pec Deck Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Machine"], movementPattern: "Chest Fly", difficulty: "Beginner", isCardio: false, aliases: ["pec deck", "machine fly"] },
  { name: "Machine Chest Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Machine"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["chest press machine", "machine press"] },
  { name: "Machine Incline Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: ["Machine"], movementPattern: "Incline Push", difficulty: "Beginner", isCardio: false, aliases: ["incline chest press machine"] },
  { name: "Smith Machine Bench Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Smith Machine"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["smith bench"] },
  { name: "Smith Machine Incline Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps"], equipment: ["Smith Machine"], movementPattern: "Incline Push", difficulty: "Beginner", isCardio: false, aliases: ["smith incline bench"] },
  { name: "Push-Up", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts", "Core"], equipment: ["Bodyweight"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["pushup", "push up"], isPopular: true },
  { name: "Weighted Push-Up", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts", "Core"], equipment: ["Bodyweight"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["weighted pushup"] },
  { name: "Deficit Push-Up", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Bodyweight"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["deep pushup"] },
  { name: "Close-Grip Push-Up", category: "Chest", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Bodyweight"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["diamond pushup", "close grip pushup"] },
  { name: "Chest Dip", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Bodyweight"], movementPattern: "Vertical Push", difficulty: "Intermediate", isCardio: false, aliases: ["dip", "forward lean dip"] },
  { name: "Assisted Chest Dip", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Machine"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["assisted dip"] },
  { name: "Landmine Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Shoulders", "Triceps", "Core"], equipment: ["Barbell"], movementPattern: "Angled Push", difficulty: "Intermediate", isCardio: false, aliases: ["landmine chest press"] },
  { name: "Single-Arm Cable Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts", "Triceps", "Core"], equipment: ["Cable"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["single arm cable chest press"] },
  { name: "Plate Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["None"], movementPattern: "Isometric Press", difficulty: "Beginner", isCardio: false, aliases: ["plate squeeze press"] },
  { name: "Floor Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["barbell floor press"] },
  { name: "Svend Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["None"], movementPattern: "Squeeze Press", difficulty: "Beginner", isCardio: false, aliases: ["plate squeeze", "standing chest squeeze"] },
  { name: "Hex Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Dumbbell"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["dumbbell hex press", "crush press"] },
  { name: "Resistance Band Chest Press", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Triceps", "Front Delts"], equipment: ["Resistance Band"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["band chest press"] },
  { name: "Resistance Band Fly", category: "Chest", primaryMuscle: "Chest", secondaryMuscles: ["Front Delts"], equipment: ["Resistance Band"], movementPattern: "Chest Fly", difficulty: "Beginner", isCardio: false, aliases: ["band fly", "band chest fly"] },
];

const backExercises: ExerciseSeed[] = [
  { name: "Barbell Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Pull", difficulty: "Intermediate", isCardio: false, aliases: ["barbell bent-over row", "bb row"], isPopular: true },
  { name: "Pendlay Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Pull", difficulty: "Advanced", isCardio: false, aliases: ["pendlay"] },
  { name: "T-Bar Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Machine"], movementPattern: "Horizontal Pull", difficulty: "Intermediate", isCardio: false, aliases: ["tbar row", "landmine row"], isPopular: true },
  { name: "Chest-Supported Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Machine"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["supported row"] },
  { name: "Seated Cable Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Cable"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["cable row"], isPopular: true },
  { name: "Single-Arm Cable Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts", "Core"], equipment: ["Cable"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["single arm cable row"] },
  { name: "Single-Arm Dumbbell Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Dumbbell"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["one arm row", "db row"], isPopular: true },
  { name: "Meadows Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts", "Core"], equipment: ["Barbell"], movementPattern: "Horizontal Pull", difficulty: "Advanced", isCardio: false, aliases: ["landmine meadows row"] },
  { name: "Lat Pulldown", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Machine"], movementPattern: "Vertical Pull", difficulty: "Beginner", isCardio: false, aliases: ["lat pull-down", "pulldown"], isPopular: true },
  { name: "Wide-Grip Lat Pulldown", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: ["Machine"], movementPattern: "Vertical Pull", difficulty: "Beginner", isCardio: false, aliases: ["wide pulldown"] },
  { name: "Close-Grip Lat Pulldown", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: ["Machine"], movementPattern: "Vertical Pull", difficulty: "Beginner", isCardio: false, aliases: ["close pulldown", "v grip pulldown"] },
  { name: "Neutral-Grip Lat Pulldown", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: ["Machine"], movementPattern: "Vertical Pull", difficulty: "Beginner", isCardio: false, aliases: ["neutral pulldown"] },
  { name: "Pull-Up", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Bodyweight"], movementPattern: "Vertical Pull", difficulty: "Intermediate", isCardio: false, aliases: ["pull up"], isPopular: true },
  { name: "Chin-Up", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: ["Bodyweight"], movementPattern: "Vertical Pull", difficulty: "Intermediate", isCardio: false, aliases: ["chin up"] },
  { name: "Assisted Pull-Up", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps"], equipment: ["Machine"], movementPattern: "Vertical Pull", difficulty: "Beginner", isCardio: false, aliases: ["assisted pull up"] },
  { name: "Straight-Arm Pulldown", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Core"], equipment: ["Cable"], movementPattern: "Shoulder Extension", difficulty: "Beginner", isCardio: false, aliases: ["straight arm pull-down"] },
  { name: "Machine High Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Machine"], movementPattern: "High Row", difficulty: "Beginner", isCardio: false, aliases: ["high row"] },
  { name: "Inverted Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Core"], equipment: ["Bodyweight"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["bodyweight row", "australian pull-up"] },
  { name: "Rack Pull", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Glutes", "Hamstrings", "Traps"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Advanced", isCardio: false, aliases: ["block pull"] },
  { name: "Deadlift", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Glutes", "Hamstrings", "Core"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Advanced", isCardio: false, aliases: ["conventional deadlift"], isPopular: true },
  { name: "Trap Bar Deadlift", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Quads", "Glutes", "Hamstrings"], equipment: ["Trap Bar"], movementPattern: "Hip Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["hex bar deadlift"] },
  { name: "Reverse-Grip Barbell Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Pull", difficulty: "Intermediate", isCardio: false, aliases: ["underhand row"] },
  { name: "Seal Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Pull", difficulty: "Intermediate", isCardio: false, aliases: ["seal bench row"] },
  { name: "Machine Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Machine"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["row machine"] },
  { name: "Resistance Band Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Rear Delts"], equipment: ["Resistance Band"], movementPattern: "Horizontal Pull", difficulty: "Beginner", isCardio: false, aliases: ["band row"] },
  { name: "Cable Pullover", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Chest", "Core"], equipment: ["Cable"], movementPattern: "Shoulder Extension", difficulty: "Beginner", isCardio: false, aliases: ["straight arm cable pullover"] },
  { name: "Renegade Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Core", "Shoulders"], equipment: ["Dumbbell"], movementPattern: "Anti-Rotation Pull", difficulty: "Advanced", isCardio: false, aliases: ["plank row"] },
  { name: "Kroc Row", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Biceps", "Grip"], equipment: ["Dumbbell"], movementPattern: "Horizontal Pull", difficulty: "Advanced", isCardio: false, aliases: ["heavy dumbbell row"] },
  { name: "Face Pull", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Rear Delts", "Rotator Cuff"], equipment: ["Cable"], movementPattern: "Scapular Retraction", difficulty: "Beginner", isCardio: false, aliases: ["cable face pull"] },
  { name: "Dumbbell Pullover", category: "Back", primaryMuscle: "Back", secondaryMuscles: ["Chest", "Core"], equipment: ["Dumbbell"], movementPattern: "Shoulder Extension", difficulty: "Intermediate", isCardio: false, aliases: ["pullover"] },
];

const shoulderExercises: ExerciseSeed[] = [
  { name: "Barbell Overhead Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Upper Chest"], equipment: ["Barbell"], movementPattern: "Vertical Push", difficulty: "Intermediate", isCardio: false, aliases: ["ohp", "military press"], isPopular: true },
  { name: "Seated Dumbbell Shoulder Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Upper Chest"], equipment: ["Dumbbell"], movementPattern: "Vertical Push", difficulty: "Intermediate", isCardio: false, aliases: ["db shoulder press"], isPopular: true },
  { name: "Arnold Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps"], equipment: ["Dumbbell"], movementPattern: "Vertical Push", difficulty: "Intermediate", isCardio: false, aliases: ["arnold dumbbell press"] },
  { name: "Machine Shoulder Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps"], equipment: ["Machine"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["shoulder press machine"] },
  { name: "Push Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Legs", "Core"], equipment: ["Barbell"], movementPattern: "Power Press", difficulty: "Advanced", isCardio: false, aliases: ["barbell push press"] },
  { name: "Landmine Shoulder Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Core"], equipment: ["Barbell"], movementPattern: "Angled Push", difficulty: "Beginner", isCardio: false, aliases: ["landmine press"] },
  { name: "Dumbbell Lateral Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Traps"], equipment: ["Dumbbell"], movementPattern: "Shoulder Abduction", difficulty: "Beginner", isCardio: false, aliases: ["lateral raise", "side raise"], isPopular: true },
  { name: "Cable Lateral Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Traps"], equipment: ["Cable"], movementPattern: "Shoulder Abduction", difficulty: "Beginner", isCardio: false, aliases: ["single arm cable lateral raise"] },
  { name: "Lean-Away Lateral Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Traps"], equipment: ["Cable"], movementPattern: "Shoulder Abduction", difficulty: "Intermediate", isCardio: false, aliases: ["lean away raise"] },
  { name: "Dumbbell Front Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Chest"], equipment: ["Dumbbell"], movementPattern: "Shoulder Flexion", difficulty: "Beginner", isCardio: false, aliases: ["front raise"] },
  { name: "Plate Front Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Chest"], equipment: ["None"], movementPattern: "Shoulder Flexion", difficulty: "Beginner", isCardio: false, aliases: ["plate raise"] },
  { name: "Cable Front Raise", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Chest"], equipment: ["Cable"], movementPattern: "Shoulder Flexion", difficulty: "Beginner", isCardio: false, aliases: ["front cable raise"] },
  { name: "Rear Delt Fly", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Back"], equipment: ["Dumbbell"], movementPattern: "Horizontal Abduction", difficulty: "Beginner", isCardio: false, aliases: ["rear delt raise", "reverse fly"] },
  { name: "Reverse Pec Deck", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Back"], equipment: ["Machine"], movementPattern: "Horizontal Abduction", difficulty: "Beginner", isCardio: false, aliases: ["reverse fly machine"] },
  { name: "Face Pull", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Back", "Rotator Cuff"], equipment: ["Cable"], movementPattern: "Scapular Retraction", difficulty: "Beginner", isCardio: false, aliases: ["rope face pull"] },
  { name: "Upright Row", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Traps", "Biceps"], equipment: ["Barbell"], movementPattern: "Vertical Pull", difficulty: "Intermediate", isCardio: false, aliases: ["barbell upright row"] },
  { name: "Snatch-Grip High Pull", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Upper Traps", "Back"], equipment: ["Barbell"], movementPattern: "Power Pull", difficulty: "Advanced", isCardio: false, aliases: ["high pull"] },
  { name: "Cuban Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Rotator Cuff", "Upper Back"], equipment: ["Dumbbell"], movementPattern: "External Rotation Press", difficulty: "Intermediate", isCardio: false, aliases: ["db cuban press"] },
  { name: "Handstand Push-Up", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps", "Core"], equipment: ["Bodyweight"], movementPattern: "Vertical Push", difficulty: "Advanced", isCardio: false, aliases: ["hspu"] },
  { name: "Smith Machine Shoulder Press", category: "Shoulders", primaryMuscle: "Shoulders", secondaryMuscles: ["Triceps"], equipment: ["Smith Machine"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["smith shoulder press"] },
];

const bicepsExercises: ExerciseSeed[] = [
  { name: "Barbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Barbell"], movementPattern: "Elbow Flexion", difficulty: "Beginner", isCardio: false, aliases: ["bb curl"], isPopular: true },
  { name: "EZ Bar Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["EZ Bar"], movementPattern: "Elbow Flexion", difficulty: "Beginner", isCardio: false, aliases: ["ez curl"], isPopular: true },
  { name: "Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Elbow Flexion", difficulty: "Beginner", isCardio: false, aliases: ["db curl"], isPopular: true },
  { name: "Incline Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Elbow Flexion", difficulty: "Intermediate", isCardio: false, aliases: ["incline curl"] },
  { name: "Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Neutral-Grip Curl", difficulty: "Beginner", isCardio: false, aliases: ["db hammer curl"], isPopular: true },
  { name: "Alternating Dumbbell Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Alternating Curl", difficulty: "Beginner", isCardio: false, aliases: ["alternating curl"] },
  { name: "Concentration Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Isolation Curl", difficulty: "Beginner", isCardio: false, aliases: ["concentration db curl"] },
  { name: "Preacher Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Machine"], movementPattern: "Supported Curl", difficulty: "Beginner", isCardio: false, aliases: ["machine preacher curl"] },
  { name: "EZ Bar Preacher Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["EZ Bar"], movementPattern: "Supported Curl", difficulty: "Intermediate", isCardio: false, aliases: ["preacher ez curl"] },
  { name: "Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Cable Curl", difficulty: "Beginner", isCardio: false, aliases: ["standing cable curl"] },
  { name: "Rope Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Neutral-Grip Curl", difficulty: "Beginner", isCardio: false, aliases: ["rope curl"] },
  { name: "Bayesian Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Lengthened Curl", difficulty: "Intermediate", isCardio: false, aliases: ["cable bayesian curl"] },
  { name: "Spider Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["EZ Bar"], movementPattern: "Supported Curl", difficulty: "Intermediate", isCardio: false, aliases: ["ez spider curl"] },
  { name: "Drag Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Barbell"], movementPattern: "Drag Curl", difficulty: "Intermediate", isCardio: false, aliases: ["barbell drag curl"] },
  { name: "Machine Biceps Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Machine"], movementPattern: "Machine Curl", difficulty: "Beginner", isCardio: false, aliases: ["biceps curl machine"] },
  { name: "Reverse Curl", category: "Biceps", primaryMuscle: "Forearms", secondaryMuscles: ["Biceps"], equipment: ["EZ Bar"], movementPattern: "Pronated Curl", difficulty: "Beginner", isCardio: false, aliases: ["reverse ez curl"] },
  { name: "Zottman Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Rotational Curl", difficulty: "Intermediate", isCardio: false, aliases: ["zottman"] },
  { name: "Cross-Body Hammer Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Dumbbell"], movementPattern: "Neutral-Grip Curl", difficulty: "Beginner", isCardio: false, aliases: ["cross body curl"] },
  { name: "Resistance Band Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Resistance Band"], movementPattern: "Band Curl", difficulty: "Beginner", isCardio: false, aliases: ["band curl"] },
  { name: "High Cable Curl", category: "Biceps", primaryMuscle: "Biceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "High Cable Curl", difficulty: "Intermediate", isCardio: false, aliases: ["front double biceps curl"] },
];

const tricepsExercises: ExerciseSeed[] = [
  { name: "Close-Grip Bench Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Barbell"], movementPattern: "Horizontal Push", difficulty: "Intermediate", isCardio: false, aliases: ["close grip bench"], isPopular: true },
  { name: "Skull Crusher", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["Barbell"], movementPattern: "Elbow Extension", difficulty: "Intermediate", isCardio: false, aliases: ["lying triceps extension"] },
  { name: "EZ Bar Skull Crusher", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["EZ Bar"], movementPattern: "Elbow Extension", difficulty: "Intermediate", isCardio: false, aliases: ["ez skull crusher"] },
  { name: "Rope Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Elbow Extension", difficulty: "Beginner", isCardio: false, aliases: ["triceps pushdown", "pushdown"], isPopular: true },
  { name: "Straight Bar Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Elbow Extension", difficulty: "Beginner", isCardio: false, aliases: ["bar pushdown"] },
  { name: "Overhead Rope Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Core"], equipment: ["Cable"], movementPattern: "Overhead Extension", difficulty: "Beginner", isCardio: false, aliases: ["rope overhead extension"] },
  { name: "Dumbbell Overhead Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Core"], equipment: ["Dumbbell"], movementPattern: "Overhead Extension", difficulty: "Beginner", isCardio: false, aliases: ["db overhead extension"] },
  { name: "Single-Arm Cable Extension", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Core"], equipment: ["Cable"], movementPattern: "Elbow Extension", difficulty: "Beginner", isCardio: false, aliases: ["single arm pushdown"] },
  { name: "Cable Kickback", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Rear Delts"], equipment: ["Cable"], movementPattern: "Kickback", difficulty: "Beginner", isCardio: false, aliases: ["triceps cable kickback"] },
  { name: "Dumbbell Kickback", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Rear Delts"], equipment: ["Dumbbell"], movementPattern: "Kickback", difficulty: "Beginner", isCardio: false, aliases: ["db kickback"] },
  { name: "Parallel Bar Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Bodyweight"], movementPattern: "Vertical Push", difficulty: "Intermediate", isCardio: false, aliases: ["triceps dip"] },
  { name: "Assisted Triceps Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Machine"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["assisted triceps dip"] },
  { name: "Machine Triceps Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: ["Machine"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["triceps dip machine"] },
  { name: "JM Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Barbell"], movementPattern: "Hybrid Press Extension", difficulty: "Advanced", isCardio: false, aliases: ["barbell jm press"] },
  { name: "Tate Press", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest"], equipment: ["Dumbbell"], movementPattern: "Press Extension", difficulty: "Intermediate", isCardio: false, aliases: ["db tate press"] },
  { name: "Bench Dip", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Shoulders", "Chest"], equipment: ["Bodyweight"], movementPattern: "Vertical Push", difficulty: "Beginner", isCardio: false, aliases: ["bodyweight bench dip"] },
  { name: "Resistance Band Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["Resistance Band"], movementPattern: "Elbow Extension", difficulty: "Beginner", isCardio: false, aliases: ["band pushdown"] },
  { name: "Reverse-Grip Pushdown", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Forearms"], equipment: ["Cable"], movementPattern: "Elbow Extension", difficulty: "Beginner", isCardio: false, aliases: ["underhand pushdown"] },
  { name: "PJR Pullover", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Lats"], equipment: ["Dumbbell"], movementPattern: "Shoulder Extension Extension", difficulty: "Advanced", isCardio: false, aliases: ["pjr extension"] },
  { name: "Smith Machine Close-Grip Bench", category: "Triceps", primaryMuscle: "Triceps", secondaryMuscles: ["Chest", "Front Delts"], equipment: ["Smith Machine"], movementPattern: "Horizontal Push", difficulty: "Beginner", isCardio: false, aliases: ["smith close grip bench"] },
];

const lowerBodyExercises: ExerciseSeed[] = [
  { name: "Back Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings", "Core"], equipment: ["Barbell"], movementPattern: "Squat", difficulty: "Intermediate", isCardio: false, aliases: ["barbell squat", "squat"], isPopular: true },
  { name: "Front Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core"], equipment: ["Barbell"], movementPattern: "Squat", difficulty: "Intermediate", isCardio: false, aliases: ["front barbell squat"] },
  { name: "Goblet Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core"], equipment: ["Dumbbell"], movementPattern: "Squat", difficulty: "Beginner", isCardio: false, aliases: ["db goblet squat"] },
  { name: "Hack Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: ["Machine"], movementPattern: "Squat", difficulty: "Beginner", isCardio: false, aliases: ["hack squat machine"] },
  { name: "Smith Machine Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Smith Machine"], movementPattern: "Squat", difficulty: "Beginner", isCardio: false, aliases: ["smith squat"] },
  { name: "Leg Press", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Machine"], movementPattern: "Leg Press", difficulty: "Beginner", isCardio: false, aliases: ["machine leg press"], isPopular: true },
  { name: "Belt Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes"], equipment: ["Machine"], movementPattern: "Squat", difficulty: "Intermediate", isCardio: false, aliases: ["belt squat machine"] },
  { name: "Split Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Bodyweight"], movementPattern: "Single-Leg Squat", difficulty: "Beginner", isCardio: false, aliases: ["bodyweight split squat"] },
  { name: "Bulgarian Split Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Dumbbell"], movementPattern: "Single-Leg Squat", difficulty: "Intermediate", isCardio: false, aliases: ["rear foot elevated split squat"], isPopular: true },
  { name: "Walking Lunge", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Dumbbell"], movementPattern: "Lunge", difficulty: "Beginner", isCardio: false, aliases: ["dumbbell walking lunge"] },
  { name: "Reverse Lunge", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Dumbbell"], movementPattern: "Lunge", difficulty: "Beginner", isCardio: false, aliases: ["db reverse lunge"] },
  { name: "Step-Up", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Dumbbell"], movementPattern: "Step-Up", difficulty: "Beginner", isCardio: false, aliases: ["box step-up"] },
  { name: "Leg Extension", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Knee Extension", difficulty: "Beginner", isCardio: false, aliases: ["machine leg extension"], isPopular: true },
  { name: "Sissy Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Core"], equipment: ["Bodyweight"], movementPattern: "Knee-Dominant Squat", difficulty: "Advanced", isCardio: false, aliases: ["bodyweight sissy squat"] },
  { name: "Pistol Squat", category: "Quads", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Core"], equipment: ["Bodyweight"], movementPattern: "Single-Leg Squat", difficulty: "Advanced", isCardio: false, aliases: ["single leg squat"] },
  { name: "Romanian Deadlift", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["rdl", "barbell rdl"], isPopular: true },
  { name: "Stiff-Leg Deadlift", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["stiff leg deadlift"] },
  { name: "Good Morning", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back", "Core"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Advanced", isCardio: false, aliases: ["barbell good morning"] },
  { name: "Hip Thrust", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Core"], equipment: ["Barbell"], movementPattern: "Hip Extension", difficulty: "Intermediate", isCardio: false, aliases: ["barbell hip thrust"], isPopular: true },
  { name: "Glute Bridge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Core"], equipment: ["Bodyweight"], movementPattern: "Hip Extension", difficulty: "Beginner", isCardio: false, aliases: ["bodyweight glute bridge"] },
  { name: "Cable Pull-Through", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Back"], equipment: ["Cable"], movementPattern: "Hip Hinge", difficulty: "Beginner", isCardio: false, aliases: ["pull through"] },
  { name: "Kettlebell Swing", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings", "Back", "Core"], equipment: ["Kettlebell"], movementPattern: "Hip Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["kb swing"], isPopular: true },
  { name: "Conventional Deadlift", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back", "Core"], equipment: ["Barbell"], movementPattern: "Hip Hinge", difficulty: "Advanced", isCardio: false, aliases: ["deadlift"] },
  { name: "Trap Bar Deadlift", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings", "Back"], equipment: ["Trap Bar"], movementPattern: "Hip Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["hex bar deadlift"] },
  { name: "Seated Leg Curl", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Knee Flexion", difficulty: "Beginner", isCardio: false, aliases: ["machine leg curl"], isPopular: true },
  { name: "Lying Leg Curl", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Knee Flexion", difficulty: "Beginner", isCardio: false, aliases: ["prone leg curl"] },
  { name: "Nordic Ham Curl", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes"], equipment: ["Bodyweight"], movementPattern: "Knee Flexion", difficulty: "Advanced", isCardio: false, aliases: ["nordic curl"] },
  { name: "Glute Ham Raise", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Back"], equipment: ["Machine"], movementPattern: "Hip Extension", difficulty: "Advanced", isCardio: false, aliases: ["ghr"] },
  { name: "Single-Leg Romanian Deadlift", category: "Hamstrings", primaryMuscle: "Hamstrings", secondaryMuscles: ["Glutes", "Core"], equipment: ["Dumbbell"], movementPattern: "Single-Leg Hinge", difficulty: "Intermediate", isCardio: false, aliases: ["single leg rdl"] },
  { name: "Curtsy Lunge", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Quads", "Hamstrings"], equipment: ["Dumbbell"], movementPattern: "Lunge", difficulty: "Beginner", isCardio: false, aliases: ["curtsy squat"] },
  { name: "Cossack Squat", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Adductors"], equipment: ["Bodyweight"], movementPattern: "Lateral Squat", difficulty: "Intermediate", isCardio: false, aliases: ["side squat"] },
  { name: "Frog Pump", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: ["Bodyweight"], movementPattern: "Hip Extension", difficulty: "Beginner", isCardio: false, aliases: ["glute frog pump"] },
  { name: "Hip Abduction Machine", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hip Stabilizers"], equipment: ["Machine"], movementPattern: "Hip Abduction", difficulty: "Beginner", isCardio: false, aliases: ["abductor machine"] },
  { name: "Cable Kickback", category: "Glutes", primaryMuscle: "Glutes", secondaryMuscles: ["Hamstrings"], equipment: ["Cable"], movementPattern: "Hip Extension", difficulty: "Beginner", isCardio: false, aliases: ["glute kickback"] },
  { name: "Standing Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Ankle Plantarflexion", difficulty: "Beginner", isCardio: false, aliases: ["calf raise"], isPopular: true },
  { name: "Seated Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Ankle Plantarflexion", difficulty: "Beginner", isCardio: false, aliases: ["seated calf"] },
  { name: "Donkey Calf Raise", category: "Calves", primaryMuscle: "Calves", secondaryMuscles: [], equipment: ["Machine"], movementPattern: "Ankle Plantarflexion", difficulty: "Intermediate", isCardio: false, aliases: ["donkey calf"] },
  { name: "Tibialis Raise", category: "Calves", primaryMuscle: "Shins", secondaryMuscles: ["Calves"], equipment: ["Bodyweight"], movementPattern: "Dorsiflexion", difficulty: "Beginner", isCardio: false, aliases: ["tib raise"] },
  { name: "Sled Push", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Calves", "Core"], equipment: ["Sled"], movementPattern: "Loaded Drive", difficulty: "Intermediate", isCardio: false, aliases: ["prowler push"] },
  { name: "Sled Drag", category: "Legs", primaryMuscle: "Quads", secondaryMuscles: ["Glutes", "Hamstrings"], equipment: ["Sled"], movementPattern: "Loaded Drag", difficulty: "Intermediate", isCardio: false, aliases: ["backward sled drag"] },
];

const coreExercises: ExerciseSeed[] = [
  { name: "Plank", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Shoulders"], equipment: ["Bodyweight"], movementPattern: "Anti-Extension", difficulty: "Beginner", isCardio: false, aliases: ["front plank"], isPopular: true },
  { name: "Side Plank", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Obliques", "Shoulders"], equipment: ["Bodyweight"], movementPattern: "Anti-Lateral Flexion", difficulty: "Beginner", isCardio: false, aliases: ["side bridge"] },
  { name: "Hanging Knee Raise", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Hip Flexion", difficulty: "Intermediate", isCardio: false, aliases: ["knee raise"], isPopular: true },
  { name: "Hanging Leg Raise", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Hip Flexion", difficulty: "Advanced", isCardio: false, aliases: ["leg raise hanging"] },
  { name: "Cable Crunch", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Obliques"], equipment: ["Cable"], movementPattern: "Spinal Flexion", difficulty: "Beginner", isCardio: false, aliases: ["kneeling cable crunch"] },
  { name: "Ab Wheel Rollout", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Lats", "Shoulders"], equipment: ["None"], movementPattern: "Anti-Extension", difficulty: "Advanced", isCardio: false, aliases: ["ab rollout", "wheel rollout"] },
  { name: "Dead Bug", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Anti-Extension", difficulty: "Beginner", isCardio: false, aliases: ["deadbug"] },
  { name: "Hollow Hold", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Isometric Hold", difficulty: "Intermediate", isCardio: false, aliases: ["hollow body hold"] },
  { name: "Russian Twist", category: "Core / Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Abs"], equipment: ["Medicine Ball"], movementPattern: "Rotation", difficulty: "Beginner", isCardio: false, aliases: ["twist"] },
  { name: "Bicycle Crunch", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Obliques"], equipment: ["Bodyweight"], movementPattern: "Rotation", difficulty: "Beginner", isCardio: false, aliases: ["bicycle"] },
  { name: "Weighted Sit-Up", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Medicine Ball"], movementPattern: "Spinal Flexion", difficulty: "Intermediate", isCardio: false, aliases: ["sit up"] },
  { name: "Decline Sit-Up", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Spinal Flexion", difficulty: "Intermediate", isCardio: false, aliases: ["decline crunch"] },
  { name: "Mountain Climber", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Shoulders", "Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Dynamic Anti-Extension", difficulty: "Beginner", isCardio: false, aliases: ["mountain climbers"] },
  { name: "Pallof Press", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Obliques"], equipment: ["Cable"], movementPattern: "Anti-Rotation", difficulty: "Beginner", isCardio: false, aliases: ["paloff press"] },
  { name: "Wood Chop", category: "Core / Abs", primaryMuscle: "Obliques", secondaryMuscles: ["Abs", "Shoulders"], equipment: ["Cable"], movementPattern: "Rotation", difficulty: "Beginner", isCardio: false, aliases: ["cable chop"] },
  { name: "Reverse Crunch", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Posterior Pelvic Tilt", difficulty: "Beginner", isCardio: false, aliases: ["lying reverse crunch"] },
  { name: "V-Up", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Hip Flexors"], equipment: ["Bodyweight"], movementPattern: "Spinal Flexion", difficulty: "Intermediate", isCardio: false, aliases: ["jackknife"] },
  { name: "Toe Touch Crunch", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Obliques"], equipment: ["Bodyweight"], movementPattern: "Spinal Flexion", difficulty: "Beginner", isCardio: false, aliases: ["toe touches"] },
  { name: "Bird Dog", category: "Core / Abs", primaryMuscle: "Core", secondaryMuscles: ["Glutes", "Shoulders"], equipment: ["Bodyweight"], movementPattern: "Anti-Rotation", difficulty: "Beginner", isCardio: false, aliases: ["bird-dog"] },
  { name: "Stability Ball Crunch", category: "Core / Abs", primaryMuscle: "Abs", secondaryMuscles: ["Obliques"], equipment: ["None"], movementPattern: "Spinal Flexion", difficulty: "Beginner", isCardio: false, aliases: ["ball crunch"] },
];

const functionalExercises: ExerciseSeed[] = [
  { name: "Farmer Carry", category: "Full Body", primaryMuscle: "Full Body", secondaryMuscles: ["Core", "Forearms", "Traps"], equipment: ["Dumbbell"], movementPattern: "Loaded Carry", difficulty: "Intermediate", isCardio: false, aliases: ["farmer walk"], isPopular: true },
  { name: "Suitcase Carry", category: "Mobility / Functional", primaryMuscle: "Core", secondaryMuscles: ["Obliques", "Forearms"], equipment: ["Dumbbell"], movementPattern: "Unilateral Carry", difficulty: "Beginner", isCardio: false, aliases: ["single arm carry"] },
  { name: "Turkish Get-Up", category: "Full Body", primaryMuscle: "Full Body", secondaryMuscles: ["Core", "Shoulders", "Glutes"], equipment: ["Kettlebell"], movementPattern: "Ground-to-Standing", difficulty: "Advanced", isCardio: false, aliases: ["tgu"] },
  { name: "Medicine Ball Slam", category: "Full Body", primaryMuscle: "Full Body", secondaryMuscles: ["Core", "Shoulders", "Lats"], equipment: ["Medicine Ball"], movementPattern: "Power Slam", difficulty: "Intermediate", isCardio: false, aliases: ["ball slam"] },
  { name: "Battle Rope Waves", category: "Full Body", primaryMuscle: "Shoulders", secondaryMuscles: ["Core", "Forearms"], equipment: ["None"], movementPattern: "Conditioning Waves", difficulty: "Intermediate", isCardio: false, aliases: ["battle ropes"] },
  { name: "Kettlebell Clean", category: "Full Body", primaryMuscle: "Full Body", secondaryMuscles: ["Glutes", "Back", "Core"], equipment: ["Kettlebell"], movementPattern: "Power Pull", difficulty: "Intermediate", isCardio: false, aliases: ["kb clean"] },
  { name: "Kettlebell Snatch", category: "Full Body", primaryMuscle: "Full Body", secondaryMuscles: ["Glutes", "Back", "Shoulders"], equipment: ["Kettlebell"], movementPattern: "Power Pull", difficulty: "Advanced", isCardio: false, aliases: ["kb snatch"] },
  { name: "Walking Carry", category: "Mobility / Functional", primaryMuscle: "Full Body", secondaryMuscles: ["Core", "Forearms", "Upper Back"], equipment: ["Dumbbell"], movementPattern: "Carry", difficulty: "Beginner", isCardio: false, aliases: ["loaded carry"] },
];

const cardioExercises: ExerciseSeed[] = [
  { name: "Walking", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Glutes"], equipment: ["None"], movementPattern: "Steady State", difficulty: "Beginner", isCardio: true, aliases: ["walk", "steps"], calorieEstimatePerMinute: 4.3, isDistanceBased: true, isStepBased: true, isPopular: true },
  { name: "Running", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Quads", "Glutes"], equipment: ["None"], movementPattern: "Steady State", difficulty: "Intermediate", isCardio: true, aliases: ["run"], calorieEstimatePerMinute: 11.5, isDistanceBased: true, isStepBased: true, isPopular: true },
  { name: "Jogging", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Glutes"], equipment: ["None"], movementPattern: "Steady State", difficulty: "Beginner", isCardio: true, aliases: ["jog"], calorieEstimatePerMinute: 8.2, isDistanceBased: true, isStepBased: true },
  { name: "Treadmill Walk", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Glutes"], equipment: ["Cardio Machine", "Treadmill"], movementPattern: "Steady State", difficulty: "Beginner", isCardio: true, aliases: ["walking treadmill", "treadmill walking"], calorieEstimatePerMinute: 4.6, isDistanceBased: true, isStepBased: true },
  { name: "Treadmill Run", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Quads", "Glutes"], equipment: ["Cardio Machine", "Treadmill"], movementPattern: "Steady State", difficulty: "Intermediate", isCardio: true, aliases: ["running treadmill", "treadmill running"], calorieEstimatePerMinute: 10.8, isDistanceBased: true, isStepBased: true },
  { name: "Cycling", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Glutes", "Calves"], equipment: ["Bike"], movementPattern: "Cyclic Endurance", difficulty: "Beginner", isCardio: true, aliases: ["bike ride", "cycling outdoor"], calorieEstimatePerMinute: 8.7, isDistanceBased: true },
  { name: "Stationary Bike", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Glutes", "Calves"], equipment: ["Cardio Machine", "Bike"], movementPattern: "Cyclic Endurance", difficulty: "Beginner", isCardio: true, aliases: ["exercise bike", "spin bike"], calorieEstimatePerMinute: 8.1, isDistanceBased: true, isPopular: true },
  { name: "Stair Climber", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Glutes", "Calves"], equipment: ["Cardio Machine", "Stair Climber"], movementPattern: "Climbing", difficulty: "Intermediate", isCardio: true, aliases: ["stairs", "stairmaster"], calorieEstimatePerMinute: 9.6, isPopular: true },
  { name: "Rowing", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Back", "Legs", "Core"], equipment: ["Cardio Machine", "Rowing Machine"], movementPattern: "Cyclic Pull", difficulty: "Intermediate", isCardio: true, aliases: ["rowing machine", "erg"], calorieEstimatePerMinute: 9.8, isPopular: true },
  { name: "Elliptical", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Glutes", "Shoulders"], equipment: ["Cardio Machine"], movementPattern: "Low Impact Endurance", difficulty: "Beginner", isCardio: true, aliases: ["elliptical trainer"], calorieEstimatePerMinute: 8.4, isDistanceBased: true },
  { name: "Jump Rope", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Shoulders"], equipment: ["None"], movementPattern: "Plyometric Endurance", difficulty: "Intermediate", isCardio: true, aliases: ["rope skip", "skipping"], calorieEstimatePerMinute: 12.1 },
  { name: "Hiking", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Glutes", "Calves", "Quads"], equipment: ["None"], movementPattern: "Outdoor Endurance", difficulty: "Beginner", isCardio: true, aliases: ["trail walk", "trail hike"], calorieEstimatePerMinute: 7.3, isDistanceBased: true, isStepBased: true },
  { name: "Sled Push Conditioning", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Glutes", "Core"], equipment: ["Sled"], movementPattern: "Loaded Conditioning", difficulty: "Advanced", isCardio: true, aliases: ["sled push cardio", "prowler"], calorieEstimatePerMinute: 11.2 },
  { name: "Sprint Intervals", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Quads", "Hamstrings", "Glutes"], equipment: ["None"], movementPattern: "Intervals", difficulty: "Advanced", isCardio: true, aliases: ["sprints", "interval sprints"], calorieEstimatePerMinute: 14.2, isDistanceBased: true, isStepBased: true },
  { name: "Incline Walk", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Calves", "Glutes"], equipment: ["Cardio Machine", "Treadmill"], movementPattern: "Incline Endurance", difficulty: "Beginner", isCardio: true, aliases: ["incline treadmill walk"], calorieEstimatePerMinute: 6.8, isDistanceBased: true, isStepBased: true },
  { name: "Assault Bike", category: "Cardio", primaryMuscle: "Cardio", secondaryMuscles: ["Legs", "Shoulders", "Core"], equipment: ["Cardio Machine", "Bike"], movementPattern: "Intervals", difficulty: "Advanced", isCardio: true, aliases: ["air bike"], calorieEstimatePerMinute: 12.7 },
];

export const cardioQuickPresets: CardioQuickPreset[] = [
  { id: "mile-1", label: "1 mile", miles: 1 },
  { id: "mile-2", label: "2 miles", miles: 2 },
  { id: "steps-5000", label: "5,000 steps", steps: 5000 },
  { id: "steps-10000", label: "10,000 steps", steps: 10000 },
  { id: "duration-30", label: "30 min cardio", durationMinutes: 30 },
];

export const exerciseDatabase: ExerciseRecord[] = [
  ...chestExercises,
  ...backExercises,
  ...shoulderExercises,
  ...bicepsExercises,
  ...tricepsExercises,
  ...lowerBodyExercises,
  ...coreExercises,
  ...functionalExercises,
  ...cardioExercises,
].map(createExercise);

export const cardioExerciseDatabase = exerciseDatabase.filter((exercise) => exercise.isCardio);
export const strengthExerciseDatabase = exerciseDatabase.filter((exercise) => !exercise.isCardio);

export const categoryFilterOrder: ExerciseCategory[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Hamstrings",
  "Quads",
  "Calves",
  "Core / Abs",
  "Full Body",
  "Mobility / Functional",
  "Cardio",
];
