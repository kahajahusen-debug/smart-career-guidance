/**
 * Unified Profile Completion Calculation Utility
 * Evaluates meaningful completion based on actual user-provided fields.
 * Empty strings, nulls, defaults, and empty arrays are treated as incomplete.
 */

export function calculateProfileCompletion(profile, user) {
  if (!profile && !user) return { percentage: 0, status: 'Not Started', completedCount: 0, totalCount: 8, missingFields: [] };

  const fullName = (profile?.full_name || user?.full_name || '').trim();
  const educationLevel = (profile?.education_level || '').trim();
  const degree = (profile?.degree || '').trim();
  const branch = (profile?.branch || '').trim();
  const experienceLevel = (profile?.experience_level || '').trim();
  const currentSkills = Array.isArray(profile?.current_skills) ? profile.current_skills.filter(s => typeof s === 'string' && s.trim().length > 0) : [];
  const interests = Array.isArray(profile?.interests) ? profile.interests.filter(i => typeof i === 'string' && i.trim().length > 0) : [];
  const preferredCategory = (profile?.preferred_category || '').trim();

  const checks = [
    { name: 'Full Name', valid: Boolean(fullName) },
    { name: 'Education Level', valid: Boolean(educationLevel) },
    { name: 'Degree / Course', valid: Boolean(degree) },
    { name: 'Field of Study / Branch', valid: Boolean(branch) },
    { name: 'Experience Level', valid: Boolean(experienceLevel) },
    { name: 'Current Skills', valid: currentSkills.length >= 2 },
    { name: 'Career Interests', valid: interests.length >= 1 },
    { name: 'Preferred Domain', valid: Boolean(preferredCategory && preferredCategory !== 'Both') }
  ];

  const completedCount = checks.filter(c => c.valid).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  let status = 'Not Started';
  if (percentage >= 100) {
    status = 'Completed';
  } else if (percentage >= 25 || currentSkills.length > 0 || educationLevel) {
    status = 'In Progress';
  }

  const missingFields = checks.filter(c => !c.valid).map(c => c.name);

  return {
    percentage,
    status,
    completedCount,
    totalCount,
    missingFields
  };
}
