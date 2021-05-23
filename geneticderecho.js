(async () => {
    const dot = await (await fetch('main.dot')).text()
    const data = vis.parseDOTNetwork(dot);
    const materiasPorCuatrimestre = 3
    const cuatrimestresPorMateria = Object.fromEntries(data.nodes.map((node) => [node.id, 1]))
    cuatrimestresPorMateria[137] = 2
    cuatrimestresPorMateria[139] = 2
    const puedeCursar = (materia, aprobadas) => {
        const requisitos = data.edges.filter((e) => e.to === materia).map((e) => e.from)
        return requisitos.every((requisito) => aprobadas.filter((a) => a === requisito).length === cuatrimestresPorMateria[requisito])
    }
    const createPopulation = (phenotype) => {
        const retval = phenotype || [];
        materiasRestantes = data.nodes.map((n) => n.id).filter((m) => retval.flat().filter((a) => m === a).length < cuatrimestresPorMateria[m]).sort(() => Math.random() - 0.5)
        while (materiasRestantes.length > 0) {
            let candidatas = materiasRestantes.filter((m) => puedeCursar(m, retval.flat()))
            let cuatri = []
            if (retval.length > 1) {
                Object.entries(cuatrimestresPorMateria).forEach(([materia, cuatrimestres]) => {
                    materia = parseInt(materia)
                    if (cuatrimestres > 1 && retval[retval.length-1].includes(materia) && (
                                retval.length < cuatrimestres ||
                                !retval[retval.length-cuatrimestres].includes(materia)
                                )
                       ) {
                        cuatri.push(materia)
                        candidatas = candidatas.filter((c) => c !== materia)
                    }
                })
            }
            cuatri = cuatri.concat(candidatas.slice(0, materiasPorCuatrimestre - cuatri.length))
            retval.push(cuatri)
            materiasRestantes = materiasRestantes.filter((m) => retval.flat().filter((a) => m === a).length < cuatrimestresPorMateria[m])
        }

        return retval;
    }
    const mutationFunction = (oldPhenotype) => {
        const tryToMutate = (materia) => {
            const phenotype = JSON.parse(JSON.stringify(oldPhenotype))
            const oldCuatri = oldPhenotype.map((cuatri) => cuatri.includes(materia)).indexOf(true)
            if (cuatrimestresPorMateria[materia] > 1) {
                const numCuatrimestres = cuatrimestresPorMateria[materia]
                for (let q = 0; q < phenotype.length; q++) {
                    if (phenotype[q].includes(materia)) {
                        phenotype[q] = phenotype[q].filter((m) => m !== materia)
                        if (!phenotype[q+numCuatrimestres]) {
                            phenotype[q+numCuatrimestres] = []
                        }
                        phenotype[q+numCuatrimestres].push(materia)
                        break
                    }
                }
            }
            let newCuatri = oldCuatri+(Math.random() > 0.5 ? 1 : -1);
            if (newCuatri === -1) {
                newCuatri += 2
            }
            phenotype[oldCuatri] = phenotype[oldCuatri].filter((m) => m !== materia)
            if (!puedeCursar(materia, phenotype.slice(0, newCuatri).flat())) {
                return null;
            }
            if (!phenotype[newCuatri]) phenotype.push([])
            phenotype[newCuatri].splice(Math.floor(Math.random() * phenotype[newCuatri].length), 1, materia)
            return createPopulation(phenotype)
        }
        for (let x = 0; x < 10; x++) {
            const materia = data.nodes[Math.floor(Math.random() * data.nodes.length)].id;
            const res = tryToMutate(materia)
            if (res !== null) {
                return res
            }
        }
        return oldPhenotype
    }
    const fitnessFunction = (phenotype) => {
        return -phenotype.length
    }
    const populationSize = 100
    const defaultPopulations = Array.from({length: populationSize}).map(() => createPopulation())
    const ga = geneticAlgorithmConstructor({
        mutationFunction,
        fitnessFunction,
        population: defaultPopulations,
        populationSize: 10,
    })
    const populationToNames = (phenotype) => {
        return phenotype.map((cuatri) => cuatri.map((m) =>
            data.nodes.filter((n) => n.id === m)[0].label
        ))
    }
    console.log((defaultPopulations[0]))
    console.log((ga.evolve().evolve().evolve().evolve().best()))
})()
