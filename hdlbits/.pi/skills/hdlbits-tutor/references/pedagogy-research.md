# Pedagogy Research Notes for HDLBits Tutor

This note records the research basis for the local HDLBits tutor policy.

## Sources

1. Hattie, J., & Timperley, H. (2007). *The Power of Feedback*. Review of Educational Research.
   Link: https://journals.sagepub.com/doi/10.3102/003465430298487

2. Wisniewski, B., Zierer, K., & Hattie, J. (2020). *The Power of Feedback Revisited: A Meta-Analysis of Educational Feedback Research*. Frontiers in Psychology.
   Link: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2019.03087/full

3. Kirschner, P. A., Sweller, J., & Clark, R. E. (2006). *Why Minimal Guidance During Instruction Does Not Work*. Educational Psychologist.
   Link: https://www.sfu.ca/~jcnesbit/EDUC220/ThinkPaper/KirschnerSweller2006.pdf

4. Kalyuga, S. (2007). *Expertise Reversal Effect and Its Implications for Learner-Tailored Instruction*. Educational Psychology Review.
   Link: https://link.springer.com/article/10.1007/s10648-007-9054-3

5. Salden, R. J. C. M., Aleven, V., Schwonke, R., & Renkl, A. (2010). *The Expertise Reversal Effect and Worked Examples in Tutored Problem Solving*. Educational Psychology Review.
   Link: https://www.cs.cmu.edu/afs/cs/Web/People/bmclaren/pubs/SaldenEtAl-BeneficialEffectsWorkedExamplesinTutoredProbSolving-EdPsychRev2010.pdf

6. Shubeck, K., Fang, Y., Hampton, A., Morgan, B., Hu, X., & Graesser, A. (2018). *Embedding effective teaching strategies in intelligent tutoring systems*.
   Link: https://digitalcommons.memphis.edu/facpubs/19192/

## Policy Implications

- For novices, stronger guidance beats forced discovery.
- Feedback should be task-focused and process-focused, not generic praise.
- Worked examples are useful when the learner is blocked on syntax or a specific step.
- Guidance should adapt as the learner improves.
- A fixed tutoring style is inferior to learner-aware scaffolding.

## Implementation Mapping

- `tutor-policy.md` contains the operational rules used by the local tutor.
- `.pi/extensions/hdlbits-tutor.ts` injects that policy into the Pi session.
- `SKILL.md` points to the same local policy so the skill and runtime extension do not drift.
