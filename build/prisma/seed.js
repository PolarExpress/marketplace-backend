"use strict";
/*
 * This program has been developed by students from the bachelor
 * Computer Science at Utrecht University within the Software Project course.
 *
 * © Copyright Utrecht University
 * (Department of Information and Computing Sciences)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const falso_1 = require("@ngneat/falso");
const prisma = new client_1.PrismaClient();
function seed_user() {
    return {
        name: (0, falso_1.randUserName)(),
        email: (0, falso_1.randEmail)()
    };
}
function seed_author(user) {
    return {
        name: user.name,
        userId: user.id
    };
}
function seed_addon() {
    return {
        name: (0, falso_1.randCompanyName)(),
        summary: (0, falso_1.randText)({ charCount: 50 }),
        icon: "",
        category: chooseFrom(Object.values(client_1.AddonCategory)),
        authorId: ""
    };
}
// Run all seeding functions
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Set the seed if one is given.
        (0, falso_1.seed)(process.argv[2]);
        // Delete all the data that is already there, ...
        yield prisma.user.deleteMany();
        yield prisma.addon.deleteMany();
        yield prisma.author.deleteMany();
        // ... and fill it up with the seeded data
        const addons = yield Promise.all(range(10).map(() => prisma.addon.create({ data: seed_addon() })));
        for (let i = 0; i < 10; i++) {
            const installs = chooseFrom([0, 0, 0, 0, 1, 2]);
            yield prisma.user.create({
                data: Object.assign(Object.assign({}, seed_user()), { installedAddons: { connect: chooseFromN(addons, installs) } })
            });
        }
        for (let i = 0; i < 6; i++) {
            const installs = chooseFrom([0, 0, 0, 0, 1, 2]);
            const createdAddons = chooseFrom([1, 1, 1, 1, 2]);
            const users = yield prisma.user.create({
                data: Object.assign(Object.assign({}, seed_user()), { installedAddons: { connect: chooseFromN(addons, installs) } })
            });
            yield prisma.author.create({
                data: Object.assign(Object.assign({}, seed_author(users)), { createdAddons: { connect: chooseFromN(addons, createdAddons) } })
            });
        }
    });
}
main();
// Utility functions
/**
 * Pick a random element from the given list
 * @param choices A list of choices
 * @returns A random element from the list
 */
function chooseFrom(choices) {
    return choices[Math.floor(Math.random() * choices.length)];
}
/**
 * Draw n elements randomly from the list of choices without repetition
 * @param choices A list of choices
 * @param n The number of desired elements
 * @returns A list of n elements
 */
function chooseFromN(choices, n) {
    const indices = choices.map((_, i) => i), result = [];
    for (let i = 0; i < n; i++)
        result.push(indices.splice(Math.floor(Math.random() * indices.length), 1)[0]);
    return result.map(i => choices[i]);
}
/**
 * Create a list of number based on a range
 * @param start the start of the range, defaults to 0
 * @param end the end of the range, inclusive
 * @returns a list of numbers [start, ..., end]
 */
function range(start, end) {
    return Array(end ? end - start : start)
        .fill(0)
        .map((_, i) => start + i);
}
