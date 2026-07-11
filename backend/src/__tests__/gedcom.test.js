const { generateGedcom } = require('../lib/gedcom');

describe('gedcom generator', () => {
  it('produces valid INDI and TRLR records', () => {
    const tree = { id: 't1', name: 'Famille Test', description: 'Note arbre' };
    const persons = [
      {
        id: 'p1',
        firstName: 'Jean',
        lastName: 'Dupont',
        gender: 'male',
        birthDate: new Date('1980-05-01T00:00:00.000Z'),
        birthPlace: 'Abidjan',
        deathDate: null,
        occupation: null,
        biography: null,
        photoUrl: null,
      },
      {
        id: 'p2',
        firstName: 'Marie',
        lastName: 'Dupont',
        gender: 'female',
        birthDate: new Date('1982-03-15T00:00:00.000Z'),
        birthPlace: null,
        deathDate: null,
        occupation: null,
        biography: 'Biographie',
        photoUrl: null,
      },
      {
        id: 'p3',
        firstName: 'Paul',
        lastName: 'Dupont',
        gender: 'male',
        birthDate: new Date('2010-01-01T00:00:00.000Z'),
        birthPlace: null,
        deathDate: null,
        occupation: null,
        biography: null,
        photoUrl: null,
      },
    ];
    const relationships = [
      { id: 'r1', type: 'spouse', sourceId: 'p1', targetId: 'p2' },
      { id: 'r2', type: 'parent', sourceId: 'p1', targetId: 'p3' },
      { id: 'r3', type: 'parent', sourceId: 'p2', targetId: 'p3' },
    ];

    const ged = generateGedcom(tree, persons, relationships);

    expect(ged).toContain('0 HEAD');
    expect(ged).toContain('0 @p1@ INDI');
    expect(ged).toContain('1 NAME Jean /Dupont/');
    expect(ged).toContain('1 SEX M');
    expect(ged).toContain('1 SEX F');
    expect(ged).toContain('0 @F1@ FAM');
    expect(ged).toContain('1 CHIL @p3@');
    expect(ged).toContain('0 TRLR');
  });
});
