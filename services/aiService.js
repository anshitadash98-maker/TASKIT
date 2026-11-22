/**
 * TASKIT AI Service — Intelligent Personal Productivity Assistant
 * Supports Dual-Engine Architecture:
 * 1. Google Gemini API (if GEMINI_API_KEY is configured in .env)
 * 2. TASKIT Rule-Based Heuristic Engine (Transparent, deterministic local fallback)
 * 
 * Zero external npm packages required (uses Node's native fetch API).
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

const isGeminiAvailable = Boolean(GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10);

/**
 * Call Google Gemini REST API directly using native fetch
 */
async function callGemini(systemInstruction, userPrompt) {
  if (!isGeminiAvailable) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY.trim()}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Gemini API Error:', response.status, errorBody);
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Empty response from Gemini API');
  }

  return JSON.parse(rawText);
}

// ============================================================================
// HELPER: Date calculations for rule-based heuristics
// ============================================================================
function getDaysDifference(targetDateStr) {
  if (!targetDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDateStr + 'T00:00:00');
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function formatDateFriendly(dateStr) {
  if (!dateStr) return 'No due date';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
}

// ============================================================================
// FEATURE 1: Intelligent Task Prioritization
// ============================================================================
async function prioritizeTasks(tasks, userContext = {}) {
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');

  if (pendingTasks.length === 0) {
    return {
      provider: isGeminiAvailable ? 'Google Gemini AI' : 'TASKIT Heuristic Engine (Local Rule-Based)',
      summary: 'You have no pending tasks! Your to-do list is completely clear.',
      recommendations: []
    };
  }

  // 1. Try Gemini Live Model if API Key is configured
  if (isGeminiAvailable) {
    try {
      const systemPrompt = `You are TASKIT AI, an expert personal productivity assistant. 
Analyze the user's tasks and return a prioritized action plan.
Respond ONLY with a JSON object in this exact schema:
{
  "summary": "Short 2-3 sentence overview of their workload and top priorities",
  "recommendations": [
    {
      "taskId": "id of task",
      "title": "task title",
      "recommendedPriority": "HIGH" | "MEDIUM" | "LOW",
      "suggestedOrder": 1,
      "reason": "Clear explanation of why this task is prioritized here based on deadlines and importance",
      "recommendedTimeAllocation": "e.g. 45 - 60 mins",
      "recommendedAction": "Actionable advice on how to tackle it"
    }
  ]
}`;
      const userContent = `Here are my pending tasks:
${JSON.stringify(pendingTasks, null, 2)}

User available time context: ${userContext.availableHours ? userContext.availableHours + ' hours' : 'Standard workday'}.
Please prioritize them intelligently.`;

      const geminiResult = await callGemini(systemPrompt, userContent);
      return {
        provider: 'Google Gemini 2.0 Flash',
        summary: geminiResult.summary,
        recommendations: geminiResult.recommendations
      };
    } catch (err) {
      console.warn('Gemini prioritization failed; falling back to transparent rule engine:', err.message);
    }
  }

  // 2. Transparent Rule-Based Engine (Deterministic Scoring)
  const scoredTasks = pendingTasks.map(task => {
    let score = 0;
    const daysDiff = getDaysDifference(task.due_date);
    const reasons = [];

    // Factor A: Due Date & Overdue Proximity
    if (daysDiff !== null) {
      if (daysDiff < 0) {
        score += 100;
        reasons.push(`Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''}`);
      } else if (daysDiff === 0) {
        score += 85;
        reasons.push('Deadline is today');
      } else if (daysDiff === 1) {
        score += 65;
        reasons.push('Deadline is tomorrow');
      } else if (daysDiff <= 3) {
        score += 45;
        reasons.push(`Approaching in ${daysDiff} days`);
      } else if (daysDiff <= 7) {
        score += 25;
        reasons.push(`Due in ${daysDiff} days`);
      } else {
        score += 10;
        reasons.push('Distant deadline');
      }
    } else {
      score += 5;
      reasons.push('No deadline set');
    }

    // Factor B: Current Priority
    if (task.priority === 'URGENT') {
      score += 40;
      reasons.push('Marked as Urgent priority');
    } else if (task.priority === 'HIGH') {
      score += 30;
      reasons.push('Marked as High priority');
    } else if (task.priority === 'MEDIUM') {
      score += 15;
    } else {
      score += 5;
    }

    // Factor C: Status Momentum
    if (task.status === 'IN_PROGRESS') {
      score += 20;
      reasons.push('Already in progress (maintain momentum)');
    } else if (task.status === 'IN_REVIEW') {
      score += 12;
    }

    // Recommended priority mapping based on score
    let recommendedPriority = 'MEDIUM';
    if (score >= 80) recommendedPriority = 'HIGH';
    else if (score <= 30) recommendedPriority = 'LOW';

    // Estimated time allocation based on description/title length
    let timeEst = '45 mins';
    const textLen = (task.title + (task.description || '')).length;
    if (textLen > 120) timeEst = '90 mins';
    else if (textLen > 60) timeEst = '60 mins';
    else if (textLen < 25) timeEst = '30 mins';

    return {
      task,
      score,
      reasons,
      recommendedPriority,
      timeEst
    };
  });

  // Sort by score descending
  scoredTasks.sort((a, b) => b.score - a.score);

  const recommendations = scoredTasks.map((item, index) => {
    const isFirst = index === 0;
    const isOverdue = item.reasons.some(r => r.includes('Overdue'));
    const isToday = item.reasons.some(r => r.includes('today'));

    let actionText = 'Schedule this for completion today.';
    if (isFirst && (isOverdue || isToday)) {
      actionText = 'Start this task first before tackling any other work.';
    } else if (item.recommendedPriority === 'LOW') {
      actionText = 'Can safely wait until high-priority deadlines are secured.';
    }

    return {
      taskId: item.task.id,
      title: item.task.title,
      currentPriority: item.task.priority,
      recommendedPriority: item.recommendedPriority,
      suggestedOrder: index + 1,
      reason: item.reasons.join('. ') + '.',
      recommendedTimeAllocation: item.timeEst,
      recommendedAction: actionText
    };
  });

  return {
    provider: 'TASKIT Heuristic Engine (Local / Deterministic)',
    summary: `Analyzed ${pendingTasks.length} pending task${pendingTasks.length > 1 ? 's' : ''}. Ranked in order of urgency, deadline proximity, and momentum.`,
    recommendations
  };
}

// ============================================================================
// FEATURE 2: "Plan My Day" Intelligent Daily Schedule
// ============================================================================
async function planMyDay(tasks, options = {}) {
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');

  if (pendingTasks.length === 0) {
    return {
      provider: isGeminiAvailable ? 'Google Gemini AI' : 'TASKIT Heuristic Engine (Local Rule-Based)',
      planTitle: 'YOUR PLAN FOR TODAY',
      totalHoursPlanned: 0,
      schedule: [],
      overflowTasks: [],
      explanation: 'No pending tasks to schedule. You are all caught up for today!'
    };
  }

  // 1. Try Gemini Live Model
  if (isGeminiAvailable) {
    try {
      const systemPrompt = `You are TASKIT AI, an expert productivity planner. 
Generate a realistic daily schedule for today starting at 09:00 AM based on the user's pending tasks.
Allocate realistic times with short breaks. Identify any tasks that cannot fit into standard 8-hour workday.
Respond ONLY with a JSON object in this exact schema:
{
  "planTitle": "YOUR PLAN FOR TODAY",
  "totalHoursPlanned": 6.5,
  "explanation": "Brief explanation of why this schedule was constructed this way",
  "schedule": [
    {
      "timeRange": "09:00 AM – 10:00 AM",
      "taskId": "id or null if break",
      "taskTitle": "Task Name or Coffee Break",
      "durationMinutes": 60,
      "notes": "Why this is scheduled at this time"
    }
  ],
  "overflowTasks": [
    {
      "taskId": "id",
      "taskTitle": "Task Name",
      "reason": "Why this can wait for tomorrow"
    }
  ]
}`;
      const userContent = `Here are my pending tasks:
${JSON.stringify(pendingTasks, null, 2)}
Available time today: ${options.availableHours || 8} hours.
Please generate my plan for today.`;

      const geminiResult = await callGemini(systemPrompt, userContent);
      return {
        provider: 'Google Gemini 2.0 Flash',
        ...geminiResult
      };
    } catch (err) {
      console.warn('Gemini Plan My Day failed; falling back to transparent rule engine:', err.message);
    }
  }

  // 2. Transparent Rule-Based Daily Scheduler
  // Prioritize tasks first using our scoring engine
  const prioritization = await prioritizeTasks(pendingTasks, options);
  const prioritizedList = prioritization.recommendations;

  const maxWorkMinutes = (options.availableHours ? Number(options.availableHours) : 7.5) * 60;
  let currentMinutes = 9 * 60; // Start at 9:00 AM (540 minutes from midnight)
  let totalPlannedMinutes = 0;

  const schedule = [];
  const overflowTasks = [];

  function formatMinutesToTime(totalMins) {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    const displayMins = mins < 10 ? '0' + mins : mins;
    return `${displayHours}:${displayMins} ${period}`;
  }

  for (let i = 0; i < prioritizedList.length; i++) {
    const item = prioritizedList[i];
    
    // Default task duration estimation (45 to 60 minutes)
    const taskDuration = item.recommendedTimeAllocation.includes('90') ? 90 : 
                         item.recommendedTimeAllocation.includes('30') ? 30 : 60;

    // Check if adding this task exceeds available time
    if (totalPlannedMinutes + taskDuration > maxWorkMinutes) {
      overflowTasks.push({
        taskId: item.taskId,
        taskTitle: item.title,
        reason: 'Cannot reasonably fit within your available work hours today; scheduled for upcoming days.'
      });
      continue;
    }

    // Schedule task
    const startTimeStr = formatMinutesToTime(currentMinutes);
    currentMinutes += taskDuration;
    const endTimeStr = formatMinutesToTime(currentMinutes);
    totalPlannedMinutes += taskDuration;

    schedule.push({
      timeRange: `${startTimeStr} – ${endTimeStr}`,
      taskId: item.taskId,
      taskTitle: item.title,
      durationMinutes: taskDuration,
      notes: item.reason
    });

    // Add a 15-minute restorative buffer break after every 1-2 tasks if time permits
    if (i < prioritizedList.length - 1 && currentMinutes < 17 * 60 && totalPlannedMinutes + 15 <= maxWorkMinutes) {
      const breakStart = formatMinutesToTime(currentMinutes);
      currentMinutes += 15;
      const breakEnd = formatMinutesToTime(currentMinutes);
      totalPlannedMinutes += 15;

      schedule.push({
        timeRange: `${breakStart} – ${breakEnd}`,
        taskId: null,
        taskTitle: '☕ Focus Refresh & Break',
        durationMinutes: 15,
        notes: 'Step away from screen to recharge cognitive focus.'
      });
    }
  }

  return {
    provider: 'TASKIT Heuristic Engine (Local / Deterministic)',
    planTitle: 'YOUR PLAN FOR TODAY',
    totalHoursPlanned: Number((totalPlannedMinutes / 60).toFixed(1)),
    explanation: `This schedule prioritizes ${schedule.filter(s => s.taskId).length} high-urgency tasks starting at 09:00 AM, pacing focus blocks with intentional breaks.`,
    schedule,
    overflowTasks
  };
}

// ============================================================================
// FEATURE 3: Natural Language Multi-Task Parser
// ============================================================================
async function parseNaturalLanguageTasks(inputText) {
  if (!inputText || !inputText.trim()) {
    return { provider: 'None', extractedTasks: [] };
  }

  // 1. Try Gemini Live Model
  if (isGeminiAvailable) {
    try {
      const systemPrompt = `You are an AI task extraction engine for TASKIT.
Extract tasks from the user's natural language input.
Today's date is: ${new Date().toISOString().split('T')[0]}.
Respond ONLY with a JSON object in this exact schema:
{
  "extractedTasks": [
    {
      "title": "Clean, concise task title",
      "description": "Any additional context or details mentioned",
      "dueDate": "YYYY-MM-DD or null if not mentioned",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "category": "General" | "Planning" | "Engineering" | "Study" | "Personal"
    }
  ]
}`;

      const geminiResult = await callGemini(systemPrompt, inputText);
      return {
        provider: 'Google Gemini 2.0 Flash',
        extractedTasks: geminiResult.extractedTasks || []
      };
    } catch (err) {
      console.warn('Gemini NLP extraction failed; falling back to transparent rule engine:', err.message);
    }
  }

  // 2. Transparent Rule-Based Natural Language Extractor
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Split input into candidate clauses (by commas, semicolons, 'and', 'then', or newlines)
  const clauses = inputText
    .split(/[,;\n]|\band\b|\bthen\b/i)
    .map(c => c.trim())
    .filter(c => c.length > 5);

  const extractedTasks = [];

  for (const clause of clauses) {
    let lower = clause.toLowerCase();

    // Skip non-task phrases
    if (/^(hello|hi|hey|can you|please|thanks)/i.test(clause) && clause.length < 25) {
      continue;
    }

    // Determine due date
    let dueDate = null;
    if (lower.includes('today') || lower.includes('tonight')) {
      dueDate = today.toISOString().split('T')[0];
    } else if (lower.includes('tomorrow')) {
      const tmrw = new Date(today.getTime() + 86400000);
      dueDate = tmrw.toISOString().split('T')[0];
    } else {
      for (let d = 0; d < dayNames.length; d++) {
        if (lower.includes(dayNames[d])) {
          const currentDay = today.getDay();
          let daysUntil = (d - currentDay + 7) % 7;
          if (daysUntil === 0) daysUntil = 7; // Next week's occurrence
          const target = new Date(today.getTime() + daysUntil * 86400000);
          dueDate = target.toISOString().split('T')[0];
          break;
        }
      }
    }

    if (!dueDate && lower.includes('next week')) {
      const nextWeek = new Date(today.getTime() + 7 * 86400000);
      dueDate = nextWeek.toISOString().split('T')[0];
    }

    // Determine priority
    let priority = 'MEDIUM';
    if (/urgent|asap|critical|immediately|must|exam|emergency/i.test(clause)) {
      priority = 'HIGH';
    } else if (/assignment|deadline|presentation|deliverable|important|interview/i.test(clause)) {
      priority = 'HIGH';
    } else if (/someday|later|optional|low priority|when free/i.test(clause)) {
      priority = 'LOW';
    }

    // Clean title
    let cleanTitle = clause
      .replace(/^(i need to|i have to|i want to|i must|please|remember to|don't forget to)\s+/i, '')
      .replace(/\bby\s+(tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, '')
      .replace(/\b(tomorrow|today|next week)\b/i, '')
      .trim();

    // Capitalize first letter
    cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    if (cleanTitle.length > 2) {
      extractedTasks.push({
        title: cleanTitle,
        description: `Parsed from input: "${clause.trim()}"`,
        dueDate: dueDate,
        priority: priority,
        category: /study|exam|assignment|class/i.test(clause) ? 'Study' : 'General'
      });
    }
  }

  return {
    provider: 'TASKIT Heuristic Engine (Local / Deterministic)',
    extractedTasks
  };
}

// ============================================================================
// FEATURE 4: Conversational Productivity Assistant Chat
// ============================================================================
async function chatAssistant(userMessage, tasks) {
  const pendingTasks = tasks.filter(t => t.status !== 'DONE');
  const lowerMsg = userMessage.toLowerCase().trim();

  // Route 1: Prioritize Request
  if (lowerMsg.includes('prioritise') || lowerMsg.includes('prioritize') || lowerMsg.includes('what should i do first') || lowerMsg.includes('what should i complete first')) {
    const result = await prioritizeTasks(tasks);
    let reply = `Here is your intelligent task prioritization (${result.provider}):\n\n`;
    if (result.recommendations.length === 0) {
      reply += "You have no pending tasks! Your to-do list is completely clear.";
    } else {
      result.recommendations.slice(0, 3).forEach((rec, i) => {
        reply += `**${i + 1}. ${rec.title}**\n• Recommended Priority: **${rec.recommendedPriority}**\n• Reason: ${rec.reason}\n• Action: ${rec.recommendedAction}\n\n`;
      });
      if (result.recommendations.length > 3) {
        reply += `*...plus ${result.recommendations.length - 3} more tasks ranked in your action list.*`;
      }
    }
    return {
      provider: result.provider,
      reply,
      actionType: 'PRIORITIZE',
      data: result
    };
  }

  // Route 2: Plan Day Request
  if (lowerMsg.includes('plan my day') || lowerMsg.includes('plan today') || lowerMsg.includes('schedule')) {
    const result = await planMyDay(tasks);
    let reply = `**${result.planTitle}** (${result.provider})\n${result.explanation}\n\n`;
    result.schedule.forEach(item => {
      reply += `⏱️ **${item.timeRange}**: ${item.taskTitle}\n`;
    });
    if (result.overflowTasks.length > 0) {
      reply += `\n*Note: ${result.overflowTasks.length} lower-urgency tasks can wait for upcoming days.*`;
    }
    return {
      provider: result.provider,
      reply,
      actionType: 'PLAN_DAY',
      data: result
    };
  }

  // Route 3: Show Urgent Tasks
  if (lowerMsg.includes('urgent') || lowerMsg.includes('overdue')) {
    const todayStr = new Date().toISOString().split('T')[0];
    const urgentTasks = pendingTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT' || (t.due_date && t.due_date < todayStr));

    let reply = ``;
    if (urgentTasks.length === 0) {
      reply = `🎉 Great news! You currently have **0 urgent or overdue tasks**. All your work is well within safe deadlines.`;
    } else {
      reply = `⚠️ Found **${urgentTasks.length} urgent/overdue item${urgentTasks.length > 1 ? 's' : ''}** needing your focus:\n\n`;
      urgentTasks.forEach(t => {
        const isOverdue = t.due_date && t.due_date < todayStr;
        reply += `• **${t.title}** — Priority: *${t.priority}* | Due: *${formatDateFriendly(t.due_date)}* ${isOverdue ? '(⚠️ OVERDUE)' : ''}\n`;
      });
    }
    return {
      provider: isGeminiAvailable ? 'Google Gemini AI' : 'TASKIT Heuristic Engine',
      reply,
      actionType: 'URGENT_TASKS',
      data: { urgentTasks }
    };
  }

  // Route 4: Natural Language Task Creation in Chat (e.g. "I need to...", "Add task...", "Remember to...")
  if (/need to|have to|add task|remember to|finish|complete/i.test(lowerMsg) && lowerMsg.length > 20) {
    const parsed = await parseNaturalLanguageTasks(userMessage);
    if (parsed.extractedTasks.length > 0) {
      return {
        provider: parsed.provider,
        reply: `I extracted **${parsed.extractedTasks.length} task${parsed.extractedTasks.length > 1 ? 's' : ''}** from your message. Please review and confirm before I save them to your board:`,
        actionType: 'EXTRACTED_TASKS',
        data: parsed
      };
    }
  }

  // Route 5: General conversational response
  if (isGeminiAvailable) {
    try {
      const systemPrompt = `You are TASKIT AI, an empathetic, encouraging, and sharp productivity coach. 
The user has ${pendingTasks.length} active tasks: ${JSON.stringify(pendingTasks.map(t => ({ title: t.title, priority: t.priority, due_date: t.due_date })))}.
Provide concise, actionable productivity advice in 2-4 sentences.`;
      const geminiResult = await callGemini(systemPrompt, userMessage);
      return {
        provider: 'Google Gemini 2.0 Flash',
        reply: typeof geminiResult === 'string' ? geminiResult : (geminiResult.reply || geminiResult.summary || JSON.stringify(geminiResult)),
        actionType: 'CHAT',
        data: null
      };
    } catch (e) {
      // fallback
    }
  }

  return {
    provider: 'TASKIT AI Assistant (Local)',
    reply: `You currently have **${pendingTasks.length} active task${pendingTasks.length !== 1 ? 's' : ''}**. Try asking:\n• *"Prioritise my tasks."*\n• *"Plan my day."*\n• *"Show my urgent tasks."*\n• Or describe new tasks naturally, e.g. *"I need to finish my report by tomorrow and study math on Thursday."*`,
    actionType: 'HELP',
    data: null
  };
}

module.exports = {
  prioritizeTasks,
  planMyDay,
  parseNaturalLanguageTasks,
  chatAssistant,
  isGeminiConfigured: () => isGeminiAvailable
};
