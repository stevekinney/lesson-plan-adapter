import type { TeachingContext } from '../../lib/taxonomy.js';

function formatSubjectAreas(items: string[]): string {
  if (items.length <= 2) return items.join(' and ');
  return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
}

export function renderTeachingContext(context: TeachingContext): string {
  const parts: string[] = [];

  if (context.gradeRange) {
    const gradePhrase = `This is a ${context.gradeRange} grade`;
    if (context.subjectAreas && context.subjectAreas.length > 0) {
      parts.push(`${gradePhrase} ${formatSubjectAreas(context.subjectAreas)}`);
    } else {
      parts.push(gradePhrase);
    }

    if (context.state) {
      parts.push(`classroom in ${context.state}`);
    } else {
      parts.push('classroom');
    }
  } else {
    if (context.subjectAreas && context.subjectAreas.length > 0) {
      parts.push(`This is a ${formatSubjectAreas(context.subjectAreas)} classroom`);
    }

    if (context.state) {
      if (parts.length === 0) {
        parts.push(`This is a classroom in ${context.state}`);
      } else {
        parts[parts.length - 1] += ` in ${context.state}`;
      }
    }
  }

  if (context.typicalBlockMinutes) {
    if (parts.length > 0) {
      parts.push(`with ${context.typicalBlockMinutes}-minute blocks`);
    } else {
      parts.push(`This classroom has ${context.typicalBlockMinutes}-minute blocks`);
    }
  }

  let sentence = '';
  if (parts.length > 0) {
    sentence = parts.join(' ') + '.';
  }

  if (context.studentsHaveDevices === true) {
    sentence += (sentence ? ' ' : '') + 'Students have devices available.';
  } else if (context.studentsHaveDevices === false) {
    sentence += (sentence ? ' ' : '') + 'Students do not have devices.';
  }

  if (context.additionalContext) {
    sentence += (sentence ? ' ' : '') + context.additionalContext;
  }

  if (context.teachingPriorities) {
    sentence += (sentence ? ' ' : '') + `Teaching priorities: ${context.teachingPriorities}.`;
  }

  if (context.knownConstraints) {
    sentence += (sentence ? ' ' : '') + `Known constraints: ${context.knownConstraints}.`;
  }

  if (!sentence) {
    return 'No additional teaching context has been provided.';
  }

  return sentence;
}
