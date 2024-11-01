import { Component } from '@angular/core';
import {BannerImgComponent} from "../../banner-img/banner-img.component";
import {MatAccordion, MatExpansionPanel, MatExpansionPanelTitle} from "@angular/material/expansion";
import {NgForOf, NgIf} from "@angular/common";

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [
    BannerImgComponent,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelTitle,
    NgForOf,
    NgIf
  ],
  templateUrl: './faq-page.component.html',
  styleUrl: './faq-page.component.scss'
})
export class FaqPageComponent {
  faqItems = [
    {
      question: 'Die Übernachtung erfolgt in Zelten. Kann ich mein eigenes Zelt mitbringen?',
      answer: 'Nein. Wir haben einen ausreichend großen Fundus an Siedlerzelten, welche imprägniert und mit einer Bodenplane versehen sind, daher ist es nicht nötig eigene Zelte mitzubringen. Wer nicht im Zelt schlafen will, kann natürlich auch am Lagerfeuer oder unter dem Sonnensegel nächtigen.'
    },
    {
      question: 'Wir sind nur zwei Personen, haben wir das Zelt für uns alleine?',
      answer: 'Nein, die Zelte sind für fünf bis sieben Personen ausgelegt. Am Anreisetag werden nach der Anmeldung die Siedler auf die Zelte verteilt. Entweder kennt ihr schon jemanden und schließt euch zusammen oder ihr werdem einem Zelt zugeteilt. Wir achten dabei immer darauf, dass in einem Zelt nie nur Neusiedler sind, sondern immer auch Altsiedler. So werdet ihr gleich in die Gemeinschaft aufgenommen.'
    },
    {
      question: 'Und was kostet das Ganze?',
      answer: 'Die Kosten für den Historischen Besiedlungszug findest du unter Anmeldung > Preise.'
    },
    {
      question: 'Was mache ich, wenn ich keine mittelalterliche Gewandung habe?',
      answer: 'Das ist nicht so schlimm. Du findest bei uns unter Neusiedler > Gewandung einige Schnittmuster und Anleitungen. Außerdem gibt es die Möglichkeit, am Anreisetag Gewandung bei uns gegen einen kleinen Obolus zu entleihen. Wir haben für dich Hosen, Tuniken, Kleider, Röcke, Gugeln, Hauben und Tücher. Alles ist dünn, du solltest also für die kalten Tage warme Unterbekleidung mitbringen. Bitte lies dir auch die Packliste vor dem Start einmal durch.'
    },
    {
      question: 'Was ist, wenn es regnet?',
      answer: 'Ein Umhang / eine Gugel aus Wollstoff / Walkloden hält den gröbsten Regen ab und trocknet dann beim Laufen sogar wieder (und sieht mittelalterlich aus!). Wer so etwas nicht hat / nicht nähen oder kaufen möchte, kann sich zur Not eine Regenjacke oder einen durchsichtigen Regenponcho mitbringen.'
    },
    {
      question: 'Welche Schuhe trage ich?',
      answer: 'Natürlich sind wir darauf bedacht, so mittelalterlich wie möglich auszusehen. Am Besten sind also Schuhe und Sandalen aus Leder. Andererseits laufen wir einen großen Teil der Strecke auf Asphalt, was unsere Vorfahren sicher nicht getan haben. Demzufolge ist es uns wichtig, dass alle blasenfrei ankommen. Daher sind auch Wanderschuhe, Trekkingsandalen o.ä. aus anderen Materialien in Ordnung, solange sie schlicht und in Naturfarben gehalten und nicht neonbunt sind.'
    },
    {
      question: 'Wie viel Gepäck wird empfohlen?',
      answer: 'Neun Tage sind eine ganze Weile. Trotzdem sollte sich jeder Teilnehmer auf eine Tasche / Rucksack beschränken. Zusätzlich gehören natürlich noch Schlafsack, Isomatte / Fell dazu. Bitte bringt keine dicken Schaumstoff-Matratzen mit, da diese sehr viel Platz auf den Wagen einnehmen, der für Gepäck, Kinder und ernsthaft Fußlahme eingeplant ist.'
    },
    {
      question: 'Wie steht es mit der Verpflegung?',
      answer: 'Die Verpflegung der drei bis vier Mahlzeiten (Frühstück, Hungerbemme für die Wanderung, Mittag und Abendessen) erfolgt durch den Caterer und ist im Preis inklusive. Darüber hinaus werden auch alkoholische und unalkoholische Getränke, sowie je nach Angebot Kuchen, Eis, Snacks und Grillgut zum Kauf angeboten. Außerdem erhältst du täglich eine Flasche Wasser, welche an der Waschstrecke wieder aufgefüllt werden kann. Heißes Wasser für Tee steht den ganzen Tag bereit.'
    },
    {
      question: 'Nehmt ihr Rücksicht auf spezielle Ernährungsformen?',
      answer: 'Es wird kein explizites „Vegetarier-Menü“ angeboten, aber der Caterer ist bemüht, das Mittagessen so anzubieten, dass man die Fleischkomponente weglassen kann. Frühstück und Abendessen werden als Buffet angerichtet. Für Veganer oder andere Ernährungsformen, wie glutenfrei oder laktosefrei, bieten wir leider keine Alternativen an.'
    },
    {
      question: 'Ich kann nicht die ganze Zeit Urlaub nehmen, nehmt ihr mich trotzdem mit?',
      answer: 'Im Allgemeinen bieten wir nur die Teilnahme der kompletten Woche an. Wenn man eher abreist, geschieht das auf eigene Kosten. Im Ausnahmefall kann man sich den Platz mit einer Person teilen, die dann die andere Wochenhälfte am Besiedlungszug teilnimmt. Dies sollten aber wirklich Ausnahmen bleiben, da es sonst bei ständig wechselnder Siedlerschaft schwierig ist, ein Gemeinschaftsgefühl aufzubauen und dies auch einen erheblichen Organisationsaufwand darstellt.'
    },
    {
      question: 'Kann ich mein Haustier mitbringen?',
      answer: 'Im Normalfall nehmen wir nur Hunde und Pferde mit, andere Tiere bedürfen der Absprache mit dem Veranstalter. Beim Mitführen von Tieren ist eine Tierhalterhaftpflicht anzuraten, und für die mitgeführten Tiere ist ein gültiger Impfausweis auf Verlangen vorzuzeigen. Sollte ein Hund aus gesundheitlichen Gründen nicht mehr mitlaufen können, muss dieser nach Hause gebracht werden. Der Transport während der gesamten Woche auf dem Planwagen ist nicht möglich.'
    },
    {
      question: 'Kann ich am Besiedlungszug teilnehmen, obwohl ich nicht volljährig bin?',
      answer: 'Kinder unter 16 bedürfen einer Aufsichtsperson, da wir deren Betreuung nicht gewährleisten können. Eltern können die Aufsicht auf eine mitreisende Erwachsene Person übertragen. Jugendliche ab 16 können mit Erlaubnis der Sorgeberechtigten und einem ausgefüllten Siedlerpass, welcher zur Veranstaltung vorliegen muss, auch allein am Besiedlungszug teilnehmen.'
    },
    {
      question: 'Ich würde euch gerne unterstützen, wie kann ich mich einbringen?',
      answer: 'Es gibt verschiedene Möglichkeiten zur Unterstützung: Teilnahme an Arbeitseinsätzen zur Instandsetzung der Wagen und Zelte, Geldspende an den Verein, Mitarbeit im Verein oder im Organisations-Team, Übernahme kleinerer Aufgaben wie Betreuung des Spendentopfes oder Zubereitung der „Hungerbemme“ sowie weitere Hilfestellungen. Für Details kontaktiere bitte info@historischer-besiedlungszug.de.'
    },
    {
      question: 'Ich kann ein Handwerk darstellen, mache Musik, bin Gaukler oder spiele Theater.',
      answer: 'Wir freuen uns über jeden, der das Bild in der Wagenburg bunter macht. Ob das Spinnrad in der Ecke oder Gitarre am Lagerfeuer, im Allgemeinen kann sich jeder, der etwas darstellen kann, einbringen. Sperrige Materialen/ Instrumente oder Requisiten, die nicht auf dem Planwagen transportiert werden können, bedürfen allerdings der Absprache. Wer Interesse hat, in der Theatergruppe mitzuwirken, kann unter info@historischer-besiedlungszug.de den Kontakt erfragen.'
    },
    {
      question: 'Ich habe Allergien, könnt ihr darauf Rücksicht nehmen?',
      answer: 'Nein, wir führen eine Outdoor-Veranstaltung mit Tieren durch. Wer eine Gräser- oder Tierhaarunverträglichkeit hat, sollte das bedenken. Für Nahrungsmittelunverträglichkeiten muss beim Caterer direkt nach Inhaltsstoffen nachgefragt werden.'
    },
    {
      question: 'Wie schnell ist der Besiedlungszug unterwegs?',
      answer: 'Im Durchschnitt laufen wir von 10 Uhr bis 14/15 Uhr und legen dabei 10-25 km zurück (inkl. einer Pause). Das Tempo ist eher mit einem straffen Wanderschritt als mit einem Spaziergang zu vergleichen und wird maßgeblich von den Pferden bestimmt. Wer kürzlich eine Fuß-/Knie- oder Hüft-OP hatte, sollte mit seinem Arzt abklären, ob er das schafft.'
    },
    {
      question: 'Wie läuft ein Tag beim Besiedlungszug allgemein ab?',
      answer: 'Der Tagesablauf unterscheidet sich an den Lauftagen und den Ruhetagen. Ein Lauftag beginnt um 07 Uhr mit Wecken, Frühstück, Abmarsch um 10 Uhr, Ankunft am neuen Lagerplatz um 14/15 Uhr und endet mit Abendessen und Lagerfeuer. An Ruhetagen gibt es kein festgelegtes Wecken und mehr Freiraum zur individuellen Gestaltung.'
    }
  ];


  activeIndex: number | null = null;

  toggleAnswer(index: number): void {
    this.activeIndex = this.activeIndex === index ? null : index;
  }
}
