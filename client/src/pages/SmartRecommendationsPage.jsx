import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, TrendingUp, Loader, AlertCircle } from 'lucide-react';
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";

export default function SmartRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scoreView, setScoreView] = useState('detailed'); // detailed or simple

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/tasks-advanced/recommendations/smart?limit=15');
        setRecommendations(response.data.tasks);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const calculateTotalScore = (task) => {
    return (
      (task.skill_match_score || 0) +
      (task.complexity_match_score || 0) +
      (task.budget_alignment_score || 0) +
      (task.popularity_score || 0) +
      (task.urgency_score || 0) +
      (task.success_rate_score || 0) +
      (task.recency_score || 0) +
      (task.team_context_score || 0)
    );
  };

  const getScoreColor = (score, max = 300) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return 'from-green-500 to-emerald-500';
    if (percent >= 60) return 'from-cyan-500 to-blue-500';
    if (percent >= 40) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const ScoreFactor = ({ label, score, maxScore = 50 }) => {
    if (!score || score === 0) return null;
    const percent = (score / maxScore) * 100;
    return (
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <div className="flex items-center gap-1">
          <span className="text-cyan-300 font-semibold">{score.toFixed(1)}</span>
          <div className="w-16 h-1.5 bg-[#0f172a] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f3a] flex items-center justify-center">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f3a] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Smart Recommendations</h1>
          </div>
          <p className="text-gray-400">
            AI-powered task recommendations based on your skills, experience, and preferences
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 mb-8">
          <Button type="button" variant={scoreView === 'simple' ? 'primary' : 'ghost'} onClick={() => setScoreView('simple')}>
            Simple View
          </Button>
          <Button type="button" variant={scoreView === 'detailed' ? 'primary' : 'ghost'} onClick={() => setScoreView('detailed')}>
            Detailed Scoring
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Recommendations */}
        <div className="space-y-4">
          {recommendations.map((task, idx) => {
            const totalScore = calculateTotalScore(task);
            const scoreColor = getScoreColor(totalScore);

            return (
              <Card
                key={task.id}
                className="relative bg-gradient-to-r from-[#1a1f3a] to-[#151d2b] border border-cyan-500/20 rounded-lg overflow-hidden hover:border-cyan-500/50 transition group"
              >
                {/* Rank Badge */}
                <div className="absolute top-2 right-2 bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold">
                  #{idx + 1}
                </div>

                <div className="p-6">
                  <div className="flex gap-6 items-start">
                    {/* Main Content */}
                    <div className="flex-1">
                      {/* Title & Creator */}
                      <div className="mb-3">
                        <h3 className="text-xl font-semibold text-white group-hover:text-cyan-400 transition cursor-pointer">
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          by {task.creator_name}
                          {task.team_name && <span className="text-cyan-400 ml-2">• {task.team_name}</span>}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                        {task.description}
                      </p>

                      {/* Task Meta */}
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Budget</div>
                          <div className="font-semibold text-green-400">${task.budget.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                          <div className={`font-semibold ${
                            task.difficulty === 'BEGINNER' ? 'text-green-400' :
                            task.difficulty === 'INTERMEDIATE' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {task.difficulty}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Success Rate</div>
                          <div className="font-semibold text-cyan-400">{(task.success_rate * 100).toFixed(0)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Views</div>
                          <div className="font-semibold text-purple-400">{task.views || 0}</div>
                        </div>
                      </div>

                      {/* Tech Stack */}
                      {task.tech_stack && task.tech_stack.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {task.tech_stack.slice(0, 6).map((tech, i) => (
                              <Badge key={i} tone="neon" className="text-xs px-2 py-1">{tech}</Badge>
                            ))}
                            {task.tech_stack.length > 6 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{task.tech_stack.length - 6}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Score Section */}
                    <div className="w-80 flex-shrink-0">
                      {/* Total Score */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-400">Match Score</div>
                          <div className={`text-2xl font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
                            {totalScore.toFixed(0)}
                          </div>
                        </div>
                        <div className="w-full bg-[#0f172a] rounded-full h-3 overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${scoreColor} transition-all duration-300`}
                            style={{ width: `${Math.min((totalScore / 300) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Detailed Scoring */}
                      {scoreView === 'detailed' && (
                        <div className="bg-[#0f172a] rounded-lg p-3 space-y-1 text-xs">
                          <ScoreFactor label="Skill Match" score={task.skill_match_score} maxScore={100} />
                          <ScoreFactor label="Complexity Fit" score={task.complexity_match_score} maxScore={50} />
                          <ScoreFactor label="Budget Alignment" score={task.budget_alignment_score} maxScore={15} />
                          <ScoreFactor label="Popularity" score={task.popularity_score} maxScore={15} />
                          <ScoreFactor label="Urgency" score={task.urgency_score} maxScore={10} />
                          <ScoreFactor label="Success Rate" score={task.success_rate_score} maxScore={10} />
                          <ScoreFactor label="Recency" score={task.recency_score} maxScore={10} />
                          <ScoreFactor label="Team Context" score={task.team_context_score} maxScore={25} />
                        </div>
                      )}

                      {/* Why This Match */}
                      {scoreView === 'simple' && (
                        <div className="bg-[#0f172a] rounded-lg p-3 space-y-2 text-xs text-gray-400">
                          <div className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">✓</span>
                            <span>
                              {task.skill_match_score > 0 && 'Matches your skills'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">✓</span>
                            <span>
                              {task.complexity_match_score > 30 && 'Perfect difficulty level for you'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-cyan-400 font-bold">✓</span>
                            <span>
                              {task.team_context_score > 0 ? 'In your team' : 'Similar tasks completed before'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button type="button" className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition">
                        View Task
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {recommendations.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No recommendations available yet. Complete some tasks to get personalized recommendations!</p>
          </div>
        )}
      </div>
    </div>
  );
}
