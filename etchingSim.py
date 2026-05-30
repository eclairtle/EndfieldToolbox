import random
from statistics import mean

ROWS = [
    ("basic 1->2", 0.600, 30, True),
    ("basic 2->3", 0.240, 60, True),
    ("basic 3->4", 0.109, 120, True),
    ("basic 4->5", 0.050, 250, True),
    ("basic 5->6", 0.027, 450, True),

    ("modifier 1->2", 0.600, 30, True),
    ("modifier 2->3", 0.240, 60, True),
    ("modifier 3->4", 0.109, 120, True),
    ("modifier 4->5", 0.050, 250, True),
    ("modifier 5->6", 0.027, 450, True),

    ("skill 1->2", 0.109, 120, True),
    ("skill 2->3", 0.042, 300, True),
]


def upgrade_one_essence(starting_coolant=0):
    coolant = starting_coolant
    essences_used = 0
    coolant_used = 0

    row_results = []

    for name, p, coolant_cost, use_coolant_strategy in ROWS:
        row_essences = 0
        row_coolant_used = 0

        if use_coolant_strategy and coolant >= coolant_cost:
            coolant -= coolant_cost
            coolant_used += coolant_cost
            row_coolant_used += coolant_cost
        else:
            while True:
                essences_used += 1
                row_essences += 1

                if random.random() < p:
                    break

                coolant += 10

                if use_coolant_strategy and coolant >= coolant_cost:
                    coolant -= coolant_cost
                    coolant_used += coolant_cost
                    row_coolant_used += coolant_cost
                    break

        row_results.append({
            "name": name,
            "essences": row_essences,
            "coolant_used": row_coolant_used,
            "ending_coolant": coolant,
        })

    return essences_used, coolant_used, coolant, row_results


def simulate_chain(num_essences=100_000, starting_coolant=0, burn_in=1_000):
    """
    Simulates upgrading many essences in a row.
    Leftover coolant from one completed essence carries into the next.

    burn_in lets the coolant economy stabilize before measuring averages.
    """
    coolant = starting_coolant

    measured_total_essences = []
    measured_total_coolant_used = []
    measured_leftover_coolant = []

    per_row_essences = {name: [] for name, *_ in ROWS}
    per_row_coolant_used = {name: [] for name, *_ in ROWS}

    total_runs = num_essences + burn_in

    for i in range(total_runs):
        essences_used, coolant_used, coolant, row_results = upgrade_one_essence(coolant)

        # Ignore early runs so starting from 0 coolant does not skew the long-run average.
        if i >= burn_in:
            measured_total_essences.append(essences_used)
            measured_total_coolant_used.append(coolant_used)
            measured_leftover_coolant.append(coolant)

            for row in row_results:
                per_row_essences[row["name"]].append(row["essences"])
                per_row_coolant_used[row["name"]].append(row["coolant_used"])

    print(f"Measured upgraded essences: {num_essences:,}")
    print(f"Burn-in essences ignored: {burn_in:,}")
    print(f"Final leftover coolant: {coolant}")
    print()
    print(f"Average essences used per completed essence: {mean(measured_total_essences):.4f}")
    print(f"Average coolant used per completed essence: {mean(measured_total_coolant_used):.4f}")
    print(f"Average leftover coolant after each completed essence: {mean(measured_leftover_coolant):.4f}")
    print()

    print("Per-row averages:")
    for name, *_ in ROWS:
        print(
            f"{name:16s} | "
            f"essences: {mean(per_row_essences[name]):8.4f} | "
            f"coolant used: {mean(per_row_coolant_used[name]):8.4f}"
        )


if __name__ == "__main__":
    simulate_chain(
        num_essences=1_000_000,
        starting_coolant=0,
        burn_in=1_000,
    )