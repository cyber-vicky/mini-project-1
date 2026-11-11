const keywords = {
  'POTHOLE': ['pothole', 'road', 'crater', 'street', 'damage', 'broken road'],
  'GARBAGE_OVERFLOW': ['garbage', 'trash', 'overflow', 'bin', 'dump', 'waste', 'smell', 'stink'],
  'STREETLIGHT': ['light', 'streetlight', 'dark', 'bulb', 'flickering', 'pole'],
  'WATER_LEAKAGE': ['water', 'pipe', 'leak', 'burst', 'flowing', 'supply', 'tap'],
  'DRAINAGE_SEWERAGE': ['drain', 'sewage', 'overflowing', 'block', 'gutter', 'manhole', 'stagnant'],
  'TRAFFIC_SIGNAL': ['traffic', 'signal', 'red light', 'broken signal', 'jam'],
  'FALLEN_TREE': ['tree', 'branch', 'fallen', 'storm', 'block'],
  'PUBLIC_PARK_ISSUE': ['park', 'bench', 'grass', 'swing', 'play', 'garden'],
  'STRAY_ANIMAL': ['dog', 'cow', 'animal', 'stray', 'bite', 'barking', 'monkey']
};

const classifyIssue = (title, description) => {
  const text = `${title} ${description}`.toLowerCase();
  
  let bestCategory = 'OTHER';
  let maxScore = 0;
  let matchedKeywords = [];

  for (const [category, words] of Object.entries(keywords)) {
    let score = 0;
    let currentMatches = [];
    
    words.forEach(word => {
      if (text.includes(word)) {
        score += 1;
        currentMatches.push(word);
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
      matchedKeywords = currentMatches;
    }
  }

  let confidence = 0;
  if (maxScore > 0) {
    confidence = Math.min(0.5 + (maxScore * 0.15), 0.98); // Max confidence 98%
  } else {
    confidence = 0.2; // Low confidence for default
  }

  return {
    category: bestCategory,
    confidence: Number(confidence.toFixed(2)),
    matchedKeywords
  };
};

module.exports = { classifyIssue };
