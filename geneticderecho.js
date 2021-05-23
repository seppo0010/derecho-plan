(async () => {
    const dot = await (await fetch('main.dot')).text()
    const data = vis.parseDOTNetwork(dot);
    const materiasPorCuatrimestre = 3
    const probabilidadAprobar = 1.0
    const anuales = [137, 139];
    const puedeCursar = (materia, aprobadas) => {
        const requisitos = data.edges.filter((e) => e.to === materia).map((e) => e.from)
        return requisitos.every((requisito) => aprobadas.filter((a) => a === requisito).length === (anuales.includes(requisito) ? 2 : 1))
    }
    const createPopulation = (phenotype, materiasRestantes) => {
        const retval = phenotype || [];
        materiasRestantes = materiasRestantes || data.nodes.map((n) => n.id).filter((m) => !retval.flat().includes(m)).sort(() => Math.random() - 0.5)
        while (materiasRestantes.length > 0) {
            const candidatas = materiasRestantes.filter((m) => puedeCursar(m, retval.flat()))
            let cuatri = []
            if (retval.length > 1) {
                anuales.forEach((a) => {
                    if (retval[retval.length-1].includes(a) && (retval.length < 2 || !retval[retval.length-2].includes(a))) {
                        cuatri.push(a)
                    }
                })
            }
            cuatri = cuatri.concat(candidatas.slice(0, materiasPorCuatrimestre - cuatri.length))
            if (cuatri.length === 0) {
                console.log(retval, cuatri, materiasRestantes)
                throw new Error()
            }
            retval.push(cuatri)
            materiasRestantes = materiasRestantes.filter((m) => !cuatri.includes(m))
        }

        return retval;
    }
    const mutationFunction = (oldPhenotype) => {
        const tryToMutate = (materia) => {
            const phenotype = JSON.parse(JSON.stringify(oldPhenotype))
            const oldCuatri = oldPhenotype.map((cuatri) => cuatri.includes(materia)).indexOf(true)
            if (anuales.includes(materia)) {
                if (phenotype[oldCuatri-1].some((m) => m !== materia)) {
                    phenotype[oldCuatri-1] = phenotype[oldCuatri-1].filter((m) => m !== materia)
                    phenotype[oldCuatri+1].push(materia)
                } else {
                    phenotype[oldCuatri] = phenotype[oldCuatri].filter((m) => m !== materia)
                    phenotype[oldCuatri+2].push(materia)
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
            return createPopulation(phenotype.flat(), true)
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
    console.log(populationToNames(defaultPopulations[0]))
    console.log(populationToNames((await ga.evolve()).best()))
})()
