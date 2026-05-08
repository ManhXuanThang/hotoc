// prisma/seed.ts — Dữ liệu mẫu cho dev
// Chạy: npx ts-node prisma/seed.ts

import { PrismaClient, Gender, RelationType, FamilyRole, ClaimStatus, ReminderType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌳 Seeding database...');

  const user = await prisma.userAccount.upsert({
    where: { phone: '+84900000001' },
    update: {},
    create: { phone: '+84900000001', displayName: 'Nguyen Van Minh (Dev)' },
  });
  console.log('✅ User:', user.phone);

  const family = await prisma.family.upsert({
    where: { id: 'seed-family-01' },
    update: {},
    create: {
      id: 'seed-family-01',
      name: 'Ho Nguyen - Ha Tinh',
      originProvince: 'Ha Tinh',
      originDistrict: 'Huong Khe',
      originCommune: 'Huong Do',
      description: 'Dong ho Nguyen tai Ha Tinh, khai hoang tu dau the ky 20',
      visibility: 'PRIVATE',
      inviteCode: 'SEED1234',
      createdById: user.id,
    },
  });

  await prisma.familyMember.upsert({
    where: { familyId_userId: { familyId: family.id, userId: user.id } },
    update: {},
    create: { familyId: family.id, userId: user.id, role: FamilyRole.SUPER_ADMIN },
  });

  type PersonSeed = {
    id: string; fullName: string; gender: Gender;
    birthDate: Date; deathDate?: Date; isAlive: boolean;
    isRootAncestor?: boolean; generationNum: number;
    currentLocation?: string; occupation?: string;
  };

  const persons: PersonSeed[] = [
    { id: 'seed-p-01', fullName: 'Nguyen Van Phuc', gender: Gender.MALE, birthDate: new Date('1892-01-01'), deathDate: new Date('1965-05-12'), isAlive: false, isRootAncestor: true, generationNum: 1 },
    { id: 'seed-p-02', fullName: 'Le Thi Hanh',     gender: Gender.FEMALE, birthDate: new Date('1896-01-01'), deathDate: new Date('1970-03-20'), isAlive: false, generationNum: 1 },
    { id: 'seed-p-03', fullName: 'Nguyen Van Hung',  gender: Gender.MALE, birthDate: new Date('1921-06-15'), deathDate: new Date('1988-11-02'), isAlive: false, generationNum: 2 },
    { id: 'seed-p-04', fullName: 'Nguyen Thi Lan',   gender: Gender.FEMALE, birthDate: new Date('1925-03-08'), deathDate: new Date('1990-08-15'), isAlive: false, generationNum: 2 },
    { id: 'seed-p-05', fullName: 'Nguyen Van Duc',   gender: Gender.MALE, birthDate: new Date('1930-09-20'), isAlive: true, generationNum: 2, currentLocation: 'Ha Tinh' },
    { id: 'seed-p-06', fullName: 'Nguyen Van Tam',   gender: Gender.MALE, birthDate: new Date('1952-04-10'), isAlive: true, generationNum: 3, currentLocation: 'Ha Noi', occupation: 'Giao vien' },
    { id: 'seed-p-07', fullName: 'Nguyen Thi Hoa',   gender: Gender.FEMALE, birthDate: new Date('1955-07-22'), isAlive: true, generationNum: 3, currentLocation: 'TP.HCM', occupation: 'Ke toan' },
    { id: 'seed-p-08', fullName: 'Nguyen Van Binh',  gender: Gender.MALE, birthDate: new Date('1958-12-05'), isAlive: true, generationNum: 3, currentLocation: 'Ha Tinh', occupation: 'Nong nghiep' },
    { id: 'seed-p-09', fullName: 'Nguyen Van Minh',  gender: Gender.MALE, birthDate: new Date('1988-02-14'), isAlive: true, generationNum: 4, currentLocation: 'TP.HCM', occupation: 'Ky su phan mem' },
    { id: 'seed-p-10', fullName: 'Nguyen Thi Thu',   gender: Gender.FEMALE, birthDate: new Date('1990-09-30'), isAlive: true, generationNum: 4, currentLocation: 'Ha Noi', occupation: 'Bac si' },
    { id: 'seed-p-11', fullName: 'Nguyen Hoang Nam', gender: Gender.MALE, birthDate: new Date('1992-05-18'), isAlive: true, generationNum: 4, currentLocation: 'TP.HCM', occupation: 'Ky su' },
  ];

  for (const p of persons) {
    await prisma.person.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, familyId: family.id,
        fullName: p.fullName, gender: p.gender,
        birthDate: p.birthDate, deathDate: p.deathDate ?? null,
        isAlive: p.isAlive, isRootAncestor: p.isRootAncestor ?? false,
        generationNum: p.generationNum,
        currentLocation: p.currentLocation ?? null,
        occupation: p.occupation ?? null,
        isVerified: true,
        createdById: user.id, approvedById: user.id,
      },
    });
  }
  console.log('✅ Persons:', persons.length);

  type RelSeed = { personId: string; relatedPersonId: string; relationType: RelationType };
  const relationships: RelSeed[] = [
    { personId: 'seed-p-01', relatedPersonId: 'seed-p-02', relationType: RelationType.SPOUSE },
    { personId: 'seed-p-02', relatedPersonId: 'seed-p-01', relationType: RelationType.SPOUSE },
    { personId: 'seed-p-01', relatedPersonId: 'seed-p-03', relationType: RelationType.PARENT },
    { personId: 'seed-p-03', relatedPersonId: 'seed-p-01', relationType: RelationType.PARENT },
    { personId: 'seed-p-01', relatedPersonId: 'seed-p-04', relationType: RelationType.PARENT },
    { personId: 'seed-p-04', relatedPersonId: 'seed-p-01', relationType: RelationType.PARENT },
    { personId: 'seed-p-01', relatedPersonId: 'seed-p-05', relationType: RelationType.PARENT },
    { personId: 'seed-p-05', relatedPersonId: 'seed-p-01', relationType: RelationType.PARENT },
    { personId: 'seed-p-03', relatedPersonId: 'seed-p-06', relationType: RelationType.PARENT },
    { personId: 'seed-p-06', relatedPersonId: 'seed-p-03', relationType: RelationType.PARENT },
    { personId: 'seed-p-03', relatedPersonId: 'seed-p-07', relationType: RelationType.PARENT },
    { personId: 'seed-p-07', relatedPersonId: 'seed-p-03', relationType: RelationType.PARENT },
    { personId: 'seed-p-05', relatedPersonId: 'seed-p-08', relationType: RelationType.PARENT },
    { personId: 'seed-p-08', relatedPersonId: 'seed-p-05', relationType: RelationType.PARENT },
    { personId: 'seed-p-06', relatedPersonId: 'seed-p-09', relationType: RelationType.PARENT },
    { personId: 'seed-p-09', relatedPersonId: 'seed-p-06', relationType: RelationType.PARENT },
    { personId: 'seed-p-06', relatedPersonId: 'seed-p-10', relationType: RelationType.PARENT },
    { personId: 'seed-p-10', relatedPersonId: 'seed-p-06', relationType: RelationType.PARENT },
    { personId: 'seed-p-07', relatedPersonId: 'seed-p-11', relationType: RelationType.PARENT },
    { personId: 'seed-p-11', relatedPersonId: 'seed-p-07', relationType: RelationType.PARENT },
  ];

  for (const r of relationships) {
    await prisma.relationship.upsert({
      where: { personId_relatedPersonId_relationType: r },
      update: {},
      create: r,
    });
  }
  console.log('✅ Relationships:', relationships.length);

  await prisma.personClaim.upsert({
    where: { userId_familyId: { userId: user.id, familyId: family.id } },
    update: {},
    create: { userId: user.id, personId: 'seed-p-09', familyId: family.id, status: ClaimStatus.APPROVED },
  });

  const thisYear = new Date().getFullYear();
  await prisma.reminder.upsert({
    where: { id: 'seed-r-01' },
    update: {},
    create: {
      id: 'seed-r-01',
      familyId: family.id,
      personId: 'seed-p-01',
      type: ReminderType.DEATH_ANNIVERSARY,
      reminderDate: new Date(`${thisYear}-05-12`),
      lunarDate: '12/4 am lich',
    },
  });

  console.log('✅ Seed xong! Dong ho:', family.name);
  console.log('   So thanh vien:', persons.length);
  console.log('   Login test: SDT +84900000001, OTP trong console');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());