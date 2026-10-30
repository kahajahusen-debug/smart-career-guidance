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
  const yearOfStudy = (profile?.year_of_study || '').trim();
  const graduationYear = profile?.graduation_year !== null && profile?.graduation_year !== undefined && String(profile?.graduation_year).trim() !== '';
  const currentSkills = Array.isArray(profile?.current_skills) ? profile.current_skills.filter(s => typeof s === 'string' && s.trim().length > 0) : [];
  const preferredCategory = (profile?.preferred_category || '').trim();

  const checks = [
    { name: 'Full Name', valid: Boolean(fullName) },
    { name: 'Education Level', valid: Boolean(educationLevel) },
    { name: 'Degree / Course', valid: Boolean(degree) },
    { name: 'Field of Study / Branch', valid: Boolean(branch) },
    { name: 'Year of Study', valid: Boolean(yearOfStudy) },
    { name: 'Graduation Year', valid: Boolean(graduationYear) },
    { name: 'Current Skills', valid: currentSkills.length >= 1 },
    { name: 'Preferred Domain', valid: Boolean(preferredCategory && preferredCategory !== 'Undecided' && preferredCategory !== 'Both') }
  ];

  const completedCount = checks.filter(c => c.valid).length;
  const totalCount = checks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  let status = 'Incomplete';
  if (percentage >= 100) {
    status = 'Completed';
  } else if (completedCount === 0) {
    status = 'Not Started';
  } else {
    status = 'Incomplete';
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
